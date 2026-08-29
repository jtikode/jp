import { unstable_cache } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";

export function isWednesdayToday(): boolean {
  return new Date().getDay() === 3;
}

export interface WednesdayDealView {
  id: string;
  productId: string;
  productName: string;
  company: string | null;
  unit: string | null;
  dealPrice: number;
  normalPrice: number;
  maxQtyPerStore: number;
  stock: number | null;
}

// Cached like the rest of the catalog reads — the deal list itself changes
// rarely (admin sets it up, it just recurs every Wednesday), so there's no
// reason for every retailer's page load to hit the database fresh.
const getCachedActiveWednesdayDeals = unstable_cache(
  async (orgId: string): Promise<WednesdayDealView[]> => {
    const db = getOrgScopedDb(orgId);
    const deals = await db.wednesdayDeal.findMany({
      where: { active: true, product: { active: true } },
      include: { product: true },
    });
    return deals.map((d) => ({
      id: d.id,
      productId: d.productId,
      productName: d.product.name,
      company: d.product.company,
      unit: d.product.unit,
      dealPrice: Number(d.dealPrice),
      normalPrice: Number(d.product.price),
      maxQtyPerStore: d.maxQtyPerStore,
      stock: d.product.stock,
    }));
  },
  ["active-wednesday-deals"],
  { revalidate: 60 },
);

export function getActiveWednesdayDeals(orgId: string): Promise<WednesdayDealView[]> {
  return getCachedActiveWednesdayDeals(orgId);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** How many more units of this deal a store can still order today — never cached, always live. */
export async function getRemainingDealQty(
  orgId: string,
  storeId: string,
  dealId: string,
  maxQtyPerStore: number,
): Promise<number> {
  const db = getOrgScopedDb(orgId);
  const today = startOfToday();

  const result = await db.orderItem.aggregate({
    where: { dealId, order: { storeId, createdAt: { gte: today } } },
    _sum: { quantity: true },
  });

  const alreadyOrdered = result._sum.quantity ?? 0;
  return Math.max(0, maxQtyPerStore - alreadyOrdered);
}

/** Same as getRemainingDealQty but for every active deal at once — used to render the catalog/home pages in one query instead of N. */
export async function getRemainingDealQtyMap(
  orgId: string,
  storeId: string,
  deals: WednesdayDealView[],
): Promise<Map<string, number>> {
  if (deals.length === 0) return new Map();
  const db = getOrgScopedDb(orgId);
  const today = startOfToday();

  const grouped = await db.orderItem.groupBy({
    by: ["dealId"],
    where: { dealId: { in: deals.map((d) => d.id) }, order: { storeId, createdAt: { gte: today } } },
    _sum: { quantity: true },
  });
  const orderedByDealId = new Map(grouped.map((g) => [g.dealId as string, g._sum.quantity ?? 0]));

  return new Map(
    deals.map((d) => [d.id, Math.max(0, d.maxQtyPerStore - (orderedByDealId.get(d.id) ?? 0))]),
  );
}
