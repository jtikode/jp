import { getOrgScopedDb } from "@/lib/orgScopedDb";

// Special rates: a shop marked with a percentage (10 or 15) pays purchase rate
// plus that percentage instead of the normal selling rate. Rules, in one place:
//  - never higher than the normal rate (some P.Rate values come from a
//    different pack size and would otherwise overcharge),
//  - items with no usable purchase rate stay at the normal rate,
//  - offer, deal and clearance prices are fixed elsewhere and are not touched
//    by this; callers only pass the plain list price through here.
// The purchase rate itself never leaves the server: callers receive only the
// final price.

export function specialPrice(price: number, purchaseRate: number | null | undefined, percent: number | null | undefined): number {
  if (!percent || percent <= 0) return price;
  if (!purchaseRate || purchaseRate <= 0 || price <= 0) return price;
  const candidate = Math.round(purchaseRate * (1 + percent / 100) * 100) / 100;
  return candidate < price ? candidate : price;
}

const PURCHASE_TTL_MS = 60_000;
const purchaseCache = new Map<string, { at: number; value: Promise<Map<string, number>> }>();

function getPurchaseRates(orgId: string): Promise<Map<string, number>> {
  const hit = purchaseCache.get(orgId);
  if (hit && Date.now() - hit.at < PURCHASE_TTL_MS) return hit.value;
  const value = (async () => {
    const db = getOrgScopedDb(orgId);
    const rows = await db.product.findMany({
      where: { active: true, purchaseRate: { not: null } },
      select: { id: true, purchaseRate: true },
    });
    return new Map(rows.map((r) => [r.id, Number(r.purchaseRate)]));
  })();
  purchaseCache.set(orgId, { at: Date.now(), value });
  value.catch(() => {
    if (purchaseCache.get(orgId)?.value === value) purchaseCache.delete(orgId);
  });
  return value;
}

const percentCache = new Map<string, { at: number; value: number | null }>();

/** The shop's special-rate percentage, or null when it is on the normal list. */
export async function getStoreRatePercent(orgId: string, storeId: string): Promise<number | null> {
  const key = `${orgId}:${storeId}`;
  const hit = percentCache.get(key);
  if (hit && Date.now() - hit.at < 20_000) return hit.value;
  const db = getOrgScopedDb(orgId);
  const store = await db.store.findUnique({ where: { id: storeId }, select: { specialRatePercent: true } });
  const raw = store?.specialRatePercent;
  const value = raw != null && Number(raw) > 0 ? Number(raw) : null;
  percentCache.set(key, { at: Date.now(), value });
  return value;
}

export function clearStoreRateCache(): void {
  percentCache.clear();
}

export type RateAdjuster = (productId: string, price: number) => number;

/** Returns a function that maps a product's normal rate to what this shop pays. */
export async function getRateAdjuster(orgId: string, storeId: string): Promise<{ adjust: RateAdjuster; special: boolean; percent: number | null }> {
  const percent = await getStoreRatePercent(orgId, storeId);
  if (!percent) return { adjust: (_id, price) => price, special: false, percent: null };
  const purchase = await getPurchaseRates(orgId);
  return { adjust: (id, price) => specialPrice(price, purchase.get(id), percent), special: true, percent };
}

/** Same objects with `price` replaced for a special-rate shop; untouched otherwise. */
export async function applyStoreRates<T extends { id: string; price: number }>(orgId: string, storeId: string, items: readonly T[]): Promise<readonly T[]> {
  const { adjust, special } = await getRateAdjuster(orgId, storeId);
  if (!special) return items;
  return items.map((p) => ({ ...p, price: adjust(p.id, p.price) }));
}
