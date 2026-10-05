import type { getOrgScopedDb } from "@/lib/orgScopedDb";

type OrgDb = ReturnType<typeof getOrgScopedDb>;

export interface OfferStat {
  adds: number;
  addRetailers: number;
  orders: number;
  orderRetailers: number;
  orderValue: number;
}

// Per-offer numbers for the admin Banners page: how often retailers added the
// offer to their cart (BannerEvent) and what actually got ordered through it
// (OrderItem.bannerId, cancelled orders left out). All-time totals. A failure
// here must never take the page down, so it degrades to "no activity".
export async function getOfferStats(db: OrgDb): Promise<Map<string, OfferStat>> {
  const stats = new Map<string, OfferStat>();
  const get = (id: string) => {
    let s = stats.get(id);
    if (!s) {
      s = { adds: 0, addRetailers: 0, orders: 0, orderRetailers: 0, orderValue: 0 };
      stats.set(id, s);
    }
    return s;
  };

  try {
    const events = await db.bannerEvent.findMany({
      where: { kind: "ADD_TO_CART" },
      select: { bannerId: true, storeId: true },
    });
    const addStores = new Map<string, Set<string>>();
    for (const e of events) {
      get(e.bannerId).adds += 1;
      if (!addStores.has(e.bannerId)) addStores.set(e.bannerId, new Set());
      addStores.get(e.bannerId)!.add(e.storeId);
    }
    for (const [id, set] of addStores) get(id).addRetailers = set.size;

    const items = await db.orderItem.findMany({
      where: { bannerId: { not: null }, order: { status: { not: "CANCELLED" } } },
      select: { bannerId: true, orderId: true, lineTotal: true, order: { select: { storeId: true } } },
    });
    const orderIds = new Map<string, Set<string>>();
    const orderStores = new Map<string, Set<string>>();
    for (const i of items) {
      const id = i.bannerId!;
      get(id).orderValue += Number(i.lineTotal);
      if (!orderIds.has(id)) orderIds.set(id, new Set());
      if (!orderStores.has(id)) orderStores.set(id, new Set());
      orderIds.get(id)!.add(i.orderId);
      orderStores.get(id)!.add(i.order.storeId);
    }
    for (const [id, set] of orderIds) get(id).orders = set.size;
    for (const [id, set] of orderStores) get(id).orderRetailers = set.size;
  } catch (err) {
    console.error("getOfferStats failed", err);
  }
  return stats;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function OfferStatsLine({ stat }: { stat: OfferStat | undefined }) {
  if (!stat || (stat.adds === 0 && stat.orders === 0)) {
    return <p className="mt-0.5 text-xs text-slate-400">No retailer activity on this offer yet.</p>;
  }
  return (
    <p className="mt-0.5 text-xs font-medium text-slate-600">
      Added to cart {plural(stat.adds, "time")} by {plural(stat.addRetailers, "retailer")} · Ordered in{" "}
      {plural(stat.orders, "order")} by {plural(stat.orderRetailers, "retailer")}
      {stat.orders > 0 ? ` · ₹${Math.round(stat.orderValue).toLocaleString("en-IN")} billed` : ""}
    </p>
  );
}
