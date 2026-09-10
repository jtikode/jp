import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { normalizeName } from "@/lib/normalizeName";
import { getActiveCatalog } from "@/lib/productCatalog";
import { getHotSellingProductIds } from "@/lib/hotSelling";
import { getActiveWednesdayDeals, getRemainingDealQtyMap, isWednesdayToday } from "@/lib/wednesdayDeals";
import { cascadingProductSearch } from "@/lib/fuzzySearch";
import { PRODUCT_PAGE_SIZE } from "@/lib/productSearchConstants";

export { PRODUCT_PAGE_SIZE };

export interface AlternativeItem {
  id: string;
  name: string;
  company: string | null;
  price: number;
  stock: number | null;
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

export async function searchProductCatalog(
  orgId: string,
  storeId: string,
  params: ProductSearchParams,
): Promise<ProductSearchResult> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const db = getOrgScopedDb(orgId);
  const [catalog, hotIds, deals, expiryItems] = await Promise.all([
    getActiveCatalog(orgId),
    getHotSellingProductIds(orgId),
    isWednesdayToday() ? getActiveWednesdayDeals(orgId) : Promise.resolve([]),
    db.expiryItem.findMany({
      where: { expiryDate: { gte: today } },
      orderBy: { expiryDate: "asc" },
    }),
  ]);

  const remainingByDealId = await getRemainingDealQtyMap(orgId, storeId, deals);
  const dealByProductId = new Map(
    deals
      .filter((d) => (remainingByDealId.get(d.id) ?? 0) > 0)
      .map((d) => [d.productId, { id: d.id, price: d.dealPrice, remainingQty: remainingByDealId.get(d.id)! }]),
  );

  const expiryByNormalizedName = new Map<string, string>();
  for (const e of expiryItems) {
    const key = normalizeName(e.itemName);
    if (!expiryByNormalizedName.has(key)) expiryByNormalizedName.set(key, e.expiryDate.toISOString());
  }

  const withMeta = catalog.map((p) => ({
    ...p,
    hot: hotIds.has(p.id),
    deal: dealByProductId.get(p.id) ?? null,
    expiryDate: expiryByNormalizedName.get(normalizeName(p.name)) ?? null,
  }));

  const sorted = [...withMeta].sort(
    (a, b) => (a.company ?? "").localeCompare(b.company ?? "") || a.name.localeCompare(b.name),
  );

  const companies = [...new Set(sorted.map((p) => p.company).filter((c): c is string => !!c))].sort();
  const salts = [...new Set(sorted.map((p) => p.composition).filter((c): c is string => !!c))].sort();

  const byComposition = new Map<string, typeof sorted>();
  for (const p of sorted) {
    const key = p.composition?.trim().toLowerCase();
    if (!key) continue;
    const group = byComposition.get(key) ?? [];
    group.push(p);
    byComposition.set(key, group);
  }

  let scoped = sorted;
  if (params.company) scoped = scoped.filter((p) => p.company === params.company);
  if (params.salt) scoped = scoped.filter((p) => p.composition === params.salt);
  if (params.hotOnly) scoped = scoped.filter((p) => p.hot);

  // Out-of-stock products are hidden from ordinary browsing/search — they
  // only reappear when the retailer types the exact product name, so an
  // exact lookup still confirms the item exists (as "Low Stock") without
  // cluttering everyday browsing with things that can't be fulfilled.
  const exactQuery = (params.query ?? "").trim().toLowerCase();
  const stockVisible = scoped.filter(
    (p) => p.stock == null || p.stock > 0 || (exactQuery.length > 0 && p.name.trim().toLowerCase() === exactQuery),
  );

  const filtered = cascadingProductSearch(stockVisible, params.query ?? "", (p) => p.name, (p) => p.composition);

  const pageItems = filtered.slice(params.offset, params.offset + params.limit);
  const hasMore = filtered.length > params.offset + params.limit;

  const products: SearchProductItem[] = pageItems.map((p) => {
    const compKey = p.composition?.trim().toLowerCase();
    const alternatives: AlternativeItem[] = compKey
      ? (byComposition.get(compKey) ?? [])
          .filter((alt) => alt.id !== p.id)
          .slice(0, MAX_ALTERNATIVES)
          .map((alt) => ({ id: alt.id, name: alt.name, company: alt.company, price: alt.price, stock: alt.stock }))
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
      stock: p.stock,
      hot: p.hot,
      deal: p.deal,
      expiryDate: p.expiryDate,
      alternatives,
    };
  });

  return { products, hasMore, companies, salts };
}
