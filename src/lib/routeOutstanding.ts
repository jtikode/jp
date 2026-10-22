import { getOrgScopedDb } from "@/lib/orgScopedDb";

export interface PartyOutstanding {
  storeId: string;
  name: string;
  externalCode: string | null;
  outstanding: number;
  bills: number;
  oldestBill: Date | null;
}

// Every store that belongs to a route: stores whose own route is this one,
// plus stores added to the route's visit list.
async function storeIdsOfRoute(orgId: string, routeId: string): Promise<string[]> {
  const db = getOrgScopedDb(orgId);
  const [direct, listed] = await Promise.all([
    db.store.findMany({ where: { routeId }, select: { id: true } }),
    db.routeStore.findMany({ where: { routeId }, select: { storeId: true } }),
  ]);
  return [...new Set([...direct.map((s) => s.id), ...listed.map((r) => r.storeId)])];
}

// Party-wise outstanding for one route, biggest dues first. Parties with
// nothing outstanding are counted but not listed.
export async function getRouteOutstanding(orgId: string, routeId: string) {
  const db = getOrgScopedDb(orgId);
  const storeIds = await storeIdsOfRoute(orgId, routeId);
  if (storeIds.length === 0) return { parties: [] as PartyOutstanding[], total: 0, partyCount: 0 };

  const [stores, sums] = await Promise.all([
    db.store.findMany({ where: { id: { in: storeIds } }, select: { id: true, name: true, externalCode: true } }),
    db.ledgerEntry.groupBy({
      by: ["storeId"],
      where: { storeId: { in: storeIds } },
      _sum: { outstandingAmount: true },
      _count: true,
      _min: { invoiceDate: true },
    }),
  ]);
  const sumByStore = new Map(sums.map((s) => [s.storeId, s]));

  const parties: PartyOutstanding[] = [];
  for (const s of stores) {
    const row = sumByStore.get(s.id);
    const amount = Number(row?._sum.outstandingAmount ?? 0);
    if (amount <= 0) continue;
    parties.push({
      storeId: s.id,
      name: s.name,
      externalCode: s.externalCode,
      outstanding: amount,
      bills: row?._count ?? 0,
      oldestBill: row?._min.invoiceDate ?? null,
    });
  }
  parties.sort((a, b) => b.outstanding - a.outstanding);
  return { parties, total: parties.reduce((a, p) => a + p.outstanding, 0), partyCount: stores.length };
}
