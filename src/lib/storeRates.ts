import { getOrgScopedDb } from "@/lib/orgScopedDb";

// Special rates: a shop marked with a percentage (10 or 15) pays purchase rate
// plus that percentage instead of the normal selling rate. Rules, in one place:
//  - never higher than the normal rate (some P.Rate values come from a
//    different pack size and would otherwise overcharge),
//  - items with no usable purchase rate stay at the normal rate,
//  - products of the Smart / Smartway / S Iconic / S Eco / JP Scheme / Theogen companies are left out
//    (see isRateExcludedCompany),
//  - offer, deal and clearance prices are fixed elsewhere and are not touched
//    by this; callers only pass the plain list price through here.
// The purchase rate itself never leaves the server: callers receive only the
// final price.

/**
 * A shop on a markup pays the normal list rate plus a percentage, but never
 * above the product's M.R.P. (selling over M.R.P. isn't allowed) and never
 * below the normal rate. Products without an M.R.P. take the full markup.
 */
export function markupPrice(price: number, mrp: number | null | undefined, percent: number | null | undefined): number {
  if (!percent || percent <= 0 || price <= 0) return price;
  const candidate = Math.round(price * (1 + percent / 100) * 100) / 100;
  if (!mrp || mrp <= 0) return candidate;
  return Math.min(candidate, Math.max(mrp, price));
}

export function specialPrice(price: number, purchaseRate: number | null | undefined, percent: number | null | undefined): number {
  if (!percent || percent <= 0) return price;
  if (!purchaseRate || purchaseRate <= 0 || price <= 0) return price;
  const candidate = Math.round(purchaseRate * (1 + percent / 100) * 100) / 100;
  return candidate < price ? candidate : price;
}

const PURCHASE_TTL_MS = 60_000;
const purchaseCache = new Map<string, { at: number; value: Promise<Map<string, number>> }>();

// Smart, Smartway (SMW), S Iconic and S Eco ranges, plus JP SCHEME and Theogen,
// never get a special rate, whatever spelling the billing software gives the
// company (SMART 2, SMW WELLNESS, 2S ICONIC, ZSMART, DEL SMW 2026 ...).
const EXCLUDED_COMPANY = /^((DEL\s+)?(2\s*)?(Z\s*)?(SMART|SMW|S\s*ICONIC|S\s*ECO)|JP\s*SCHEME|THEO(GEN|N))/;
const squash = (s: string) => s.replace(/\s+/g, " ").trim().toUpperCase();

export function isRateExcludedCompany(company: string | null | undefined): boolean {
  return !!company && EXCLUDED_COMPANY.test(squash(company));
}

function getPurchaseRates(orgId: string): Promise<Map<string, number>> {
  const hit = purchaseCache.get(orgId);
  if (hit && Date.now() - hit.at < PURCHASE_TTL_MS) return hit.value;
  const value = (async () => {
    const db = getOrgScopedDb(orgId);
    const rows = await db.product.findMany({
      where: { active: true },
      select: { id: true, name: true, company: true, purchaseRate: true },
    });
    // Old billing imports left a copy of some products with no company: those
    // take the company of the same-named product that has one.
    const companyByName = new Map<string, string>();
    for (const r of rows) if (r.company) companyByName.set(squash(r.name), r.company);
    const out = new Map<string, number>();
    for (const r of rows) {
      if (r.purchaseRate == null) continue;
      if (isRateExcludedCompany(r.company ?? companyByName.get(squash(r.name)))) continue;
      out.set(r.id, Number(r.purchaseRate));
    }
    return out;
  })();
  purchaseCache.set(orgId, { at: Date.now(), value });
  value.catch(() => {
    if (purchaseCache.get(orgId)?.value === value) purchaseCache.delete(orgId);
  });
  return value;
}

const MRP_TTL_MS = 60_000;
const mrpCache = new Map<string, { at: number; value: Promise<Map<string, number>> }>();

function getMrps(orgId: string): Promise<Map<string, number>> {
  const hit = mrpCache.get(orgId);
  if (hit && Date.now() - hit.at < MRP_TTL_MS) return hit.value;
  const value = (async () => {
    const db = getOrgScopedDb(orgId);
    const rows = await db.product.findMany({ where: { active: true, mrp: { gt: 0 } }, select: { id: true, mrp: true } });
    return new Map(rows.map((r) => [r.id, Number(r.mrp)]));
  })();
  mrpCache.set(orgId, { at: Date.now(), value });
  value.catch(() => {
    if (mrpCache.get(orgId)?.value === value) mrpCache.delete(orgId);
  });
  return value;
}

interface StoreRateConfig {
  special: number | null;
  markup: number | null;
}

const configCache = new Map<string, { at: number; value: StoreRateConfig }>();

async function getStoreRateConfig(orgId: string, storeId: string): Promise<StoreRateConfig> {
  const key = `${orgId}:${storeId}`;
  const hit = configCache.get(key);
  if (hit && Date.now() - hit.at < 20_000) return hit.value;
  const db = getOrgScopedDb(orgId);
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { specialRatePercent: true, rateMarkupPercent: true },
  });
  const positive = (raw: unknown) => (raw != null && Number(raw) > 0 ? Number(raw) : null);
  const value = { special: positive(store?.specialRatePercent), markup: positive(store?.rateMarkupPercent) };
  configCache.set(key, { at: Date.now(), value });
  return value;
}

/** The shop's special-rate percentage, or null when it is not a special-rate (Gold) shop. */
export async function getStoreRatePercent(orgId: string, storeId: string): Promise<number | null> {
  return (await getStoreRateConfig(orgId, storeId)).special;
}

/** True when the shop's prices differ from the shared list (special rate or markup). */
export async function storeHasOwnRates(orgId: string, storeId: string): Promise<boolean> {
  const { special, markup } = await getStoreRateConfig(orgId, storeId);
  return special != null || markup != null;
}

export function clearStoreRateCache(): void {
  configCache.clear();
}

export type RateAdjuster = (productId: string, price: number) => number;

/** Returns a function that maps a product's normal rate to what this shop pays. */
export async function getRateAdjuster(orgId: string, storeId: string): Promise<{ adjust: RateAdjuster; special: boolean; percent: number | null; adjusted: boolean }> {
  const { special, markup } = await getStoreRateConfig(orgId, storeId);
  if (special) {
    const purchase = await getPurchaseRates(orgId);
    return { adjust: (id, price) => specialPrice(price, purchase.get(id), special), special: true, percent: special, adjusted: true };
  }
  if (markup) {
    const mrps = await getMrps(orgId);
    return { adjust: (id, price) => markupPrice(price, mrps.get(id), markup), special: false, percent: null, adjusted: true };
  }
  return { adjust: (_id, price) => price, special: false, percent: null, adjusted: false };
}

/** Same objects with `price` replaced for a special-rate shop; untouched otherwise. */
export async function applyStoreRates<T extends { id: string; price: number }>(orgId: string, storeId: string, items: readonly T[]): Promise<readonly T[]> {
  const { adjust, adjusted } = await getRateAdjuster(orgId, storeId);
  if (!adjusted) return items;
  return items.map((p) => ({ ...p, price: adjust(p.id, p.price) }));
}
