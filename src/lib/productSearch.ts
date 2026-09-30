import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { normalizeName } from "@/lib/normalizeName";
import { getActiveCatalog, type CatalogProduct } from "@/lib/productCatalog";
import { getHotSellingProductIds } from "@/lib/hotSelling";
import { getActiveWednesdayDeals, getRemainingDealQtyMap, isWednesdayToday } from "@/lib/wednesdayDeals";
import { cascadingProductSearch } from "@/lib/fuzzySearch";
import { PRODUCT_PAGE_SIZE } from "@/lib/productSearchConstants";
import { byExpiryThenStockThenStrengthThenName, alternativesCap } from "@/lib/stockRank";
import { getStartOfIstDayUtc } from "@/lib/istTime";

export { PRODUCT_PAGE_SIZE };

// Alternatives carry the same details as a main product row (pack, MRP, tax,
// scheme, expiry, category…) so a retailer can compare and order them without
// having to search for each one first.
export interface AlternativeItem {
  id: string;
  name: string;
  company: string | null;
  unit: string | null;
  price: number;
  mrp: number | null;
  taxPercent: number | null;
  scheme: string | null;
  composition: string | null;
  category: string | null;
  imageUrl: string | null;
  onRequest: boolean;
  stock: number | null;
  expiryDate: string | null;
}

export interface SearchProductItem {
  id: string;
  name: string;
  company: string | null;
  unit: string | null;
  price: number;
  mrp: number | null;
  taxPercent: number | null;
  scheme: string | null;
  composition: string | null;
  category: string | null;
  imageUrl: string | null;
  onRequest: boolean;
  stock: number | null;
  hot: boolean;
  deal: { id: string; price: number; remainingQty: number } | null;
  expiryDate: string | null;
  // Other active products sharing this product's exact composition — resolved
  // server-side (against the full cached catalog) and attached per item, so
  // the client never needs the whole catalog in memory just to cross-reference
  // "alternatives" for the ~40 products actually on screen.
  alternatives: AlternativeItem[];
}

export interface ProductSearchParams {
  query?: string;
  company?: string;
  salt?: string;
  hotOnly?: boolean;
  offset: number;
  limit: number;
}

export interface ProductSearchResult {
  products: SearchProductItem[];
  hasMore: boolean;
  // Full distinct lists for the filter dropdowns — small even though the
  // catalog itself is large, so shipping these once is cheap.
  companies: string[];
  salts: string[];
}

const MAX_ALTERNATIVES = 8;

interface IndexedProduct extends CatalogProduct {
  hot: boolean;
  expiryDate: string | null;
}

interface CatalogIndex {
  // Hot-selling products first (best seller first), then everything else by
  // company and name, so a retailer opening the order screen always sees
  // what's moving at the top.
  ordered: IndexedProduct[];
  companies: string[];
  salts: string[];
  byComposition: Map<string, IndexedProduct[]>;
}

// The sorted/indexed view of an org's catalog is identical for every
// retailer, so it's built once per minute and shared, instead of being
// rebuilt (sort, map, an ExpiryItem query) on every keystroke of every
// retailer. Caching the promise also means a burst of requests right after
// expiry waits on one build rather than each starting their own.
const INDEX_TTL_MS = 45_000;
const indexCache = new Map<string, { at: number; value: Promise<CatalogIndex> }>();

async function buildCatalogIndex(orgId: string): Promise<CatalogIndex> {
  const today = getStartOfIstDayUtc();
  const db = getOrgScopedDb(orgId);
  const [catalog, hotIds, expiryItems] = await Promise.all([
    getActiveCatalog(orgId),
    getHotSellingProductIds(orgId),
    db.expiryItem.findMany({
      where: { expiryDate: { gte: today } },
      orderBy: { expiryDate: "asc" },
    }),
  ]);

  const expiryByNormalizedName = new Map<string, string>();
  for (const e of expiryItems) {
    const key = normalizeName(e.itemName);
    if (!expiryByNormalizedName.has(key)) expiryByNormalizedName.set(key, e.expiryDate.toISOString());
  }

  // The Set is built from the ranked list, so iteration order is the rank.
  const hotRank = new Map<string, number>();
  for (const id of hotIds) hotRank.set(id, hotRank.size);

  const ordered: IndexedProduct[] = catalog
    .map((p) => ({
      ...p,
      hot: hotRank.has(p.id),
      // The curated Clearance date takes priority when both exist (it's what
      // actually drives the discount there), but most products only have
      // their own recorded nearestExpiry — that's still worth showing.
      expiryDate: expiryByNormalizedName.get(normalizeName(p.name)) ?? p.nearestExpiry ?? null,
    }))
    .sort(
      (a, b) =>
        (hotRank.get(a.id) ?? Infinity) - (hotRank.get(b.id) ?? Infinity) ||
        (a.company ?? "").localeCompare(b.company ?? "") ||
        a.name.localeCompare(b.name),
    );

  const companies = [...new Set(ordered.map((p) => p.company).filter((c): c is string => !!c))].sort();
  const salts = [...new Set(ordered.map((p) => p.composition).filter((c): c is string => !!c))].sort();

  const byComposition = new Map<string, IndexedProduct[]>();
  for (const p of ordered) {
    const key = p.composition?.trim().toLowerCase();
    if (!key) continue;
    const group = byComposition.get(key) ?? [];
    group.push(p);
    byComposition.set(key, group);
  }

  return { ordered, companies, salts, byComposition };
}

function getCatalogIndex(orgId: string): Promise<CatalogIndex> {
  const hit = indexCache.get(orgId);
  if (hit && Date.now() - hit.at < INDEX_TTL_MS) return hit.value;
  const value = buildCatalogIndex(orgId);
  indexCache.set(orgId, { at: Date.now(), value });
  // A failed build must not be served for the next 45 seconds.
  value.catch(() => {
    if (indexCache.get(orgId)?.value === value) indexCache.delete(orgId);
  });
  return value;
}

export async function searchProductCatalog(
  orgId: string,
  storeId: string,
  params: ProductSearchParams,
): Promise<ProductSearchResult> {
  const index = await getCatalogIndex(orgId);
  const { companies, salts, byComposition } = index;

  // Wednesday deals are per-store (remaining quota), so they can't live in
  // the shared index; they only exist one day a week and only a handful of
  // products carry one.
  const deals = isWednesdayToday() ? await getActiveWednesdayDeals(orgId) : [];
  const remainingByDealId = await getRemainingDealQtyMap(orgId, storeId, deals);
  const dealByProductId = new Map(
    deals
      .filter((d) => (remainingByDealId.get(d.id) ?? 0) > 0)
      .map((d) => [d.productId, { id: d.id, price: d.dealPrice, remainingQty: remainingByDealId.get(d.id)! }]),
  );

  let scoped = index.ordered;
  if (params.company) scoped = scoped.filter((p) => p.company === params.company);
  if (params.salt) scoped = scoped.filter((p) => p.composition === params.salt);
  if (params.hotOnly) scoped = scoped.filter((p) => p.hot);

  // Out-of-stock products stay visible in browsing/search — they show a
  // "Low Stock" badge (see ProductList) instead of being hidden, so a
  // retailer can still see and order something that's momentarily at 0.
  const filtered = cascadingProductSearch(scoped, params.query ?? "", (p) => p.name, (p) => p.composition);

  const pageItems = filtered.slice(params.offset, params.offset + params.limit);
  const hasMore = filtered.length > params.offset + params.limit;

  const products: SearchProductItem[] = pageItems.map((p) => {
    const compKey = p.composition?.trim().toLowerCase();
    const alternatives: AlternativeItem[] = compKey
      ? (() => {
          const sortedAlts = (byComposition.get(compKey) ?? [])
            .filter((alt) => alt.id !== p.id)
            .sort(byExpiryThenStockThenStrengthThenName(p.name));
          return sortedAlts
            .slice(0, alternativesCap(sortedAlts, MAX_ALTERNATIVES))
            .map(
              (alt): AlternativeItem => ({
                id: alt.id,
                name: alt.name,
                company: alt.company,
                unit: alt.unit,
                price: alt.price,
                mrp: alt.mrp,
                taxPercent: alt.taxPercent,
                scheme: alt.scheme,
                composition: alt.composition,
                category: alt.category,
                imageUrl: alt.imageUrl,
                onRequest: alt.onRequest,
                stock: alt.stock,
                expiryDate: alt.expiryDate,
              }),
            );
        })()
      : [];

    return {
      id: p.id,
      name: p.name,
      company: p.company,
      unit: p.unit,
      price: p.price,
      mrp: p.mrp,
      taxPercent: p.taxPercent,
      scheme: p.scheme,
      composition: p.composition,
      category: p.category,
      imageUrl: p.imageUrl,
      onRequest: p.onRequest,
      stock: p.stock,
      hot: p.hot,
      deal: dealByProductId.get(p.id) ?? null,
      expiryDate: p.expiryDate,
      alternatives,
    };
  });

  return { products, hasMore, companies, salts };
}
