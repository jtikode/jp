import { getActiveCatalog } from "@/lib/productCatalog";

// What an offer banner stores in ShopBanner.cartItems: the products (and how
// many of each) that get dropped into the cart when a retailer taps the offer.
// `quantity` is the total units added; `freeQty` is how many of those are
// free of charge (0 = all paid). Gift items already priced at 0 can use 0 too.
export interface BundleItem {
  productId: string;
  quantity: number;
  freeQty: number;
}

export interface ResolvedBundleItem extends BundleItem {
  name: string;
  unitPrice: number;
  stock: number | null;
}

export const MAX_BUNDLE_ITEMS = 20;
export const MAX_BUNDLE_QTY = 10000;

// Lenient: used when reading stored JSON, drops anything malformed instead of
// throwing so one bad row can't break the shop's home page.
export function parseBundleItems(raw: unknown): BundleItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: BundleItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const { productId, quantity, freeQty } = entry as Record<string, unknown>;
    if (typeof productId !== "string" || !productId || seen.has(productId)) continue;
    const q = Number(quantity);
    const f = Number(freeQty ?? 0);
    if (!Number.isInteger(q) || q < 1 || q > MAX_BUNDLE_QTY) continue;
    if (!Number.isInteger(f) || f < 0 || f > q) continue;
    seen.add(productId);
    items.push({ productId, quantity: q, freeQty: f });
  }
  return items.slice(0, MAX_BUNDLE_ITEMS);
}

// Shape handed to the shop's tap-to-add component for one banner.
export async function getOfferBundle(
  orgId: string,
  banner: { id: string; title: string | null; cartItems: unknown },
): Promise<{ bannerId: string; title: string | null; lines: ResolvedBundleItem[] } | null> {
  const lines = await resolveBundle(orgId, banner.cartItems);
  return lines.length > 0 ? { bannerId: banner.id, title: banner.title, lines } : null;
}

// Joins the stored bundle with the live catalog (name, current rate, stock).
// An offer whose products can't all be found is treated as having no bundle at
// all: half an offer in the cart would be worse than a plain banner.
export async function resolveBundle(orgId: string, raw: unknown): Promise<ResolvedBundleItem[]> {
  const items = parseBundleItems(raw);
  if (items.length === 0) return [];
  const catalog = await getActiveCatalog(orgId);
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const resolved: ResolvedBundleItem[] = [];
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p) return [];
    resolved.push({ ...item, name: p.name, unitPrice: p.price, stock: p.stock });
  }
  return resolved;
}
