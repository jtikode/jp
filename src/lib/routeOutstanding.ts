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
export async function storeIdsOfRoute(orgId: string, routeId: string): Promise<string[]> {
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

export interface RouteTotal {
  routeId: string;
  name: string;
  total: number;
  partiesWithDues: number;
}

// Dues for every route in one pass (stores of a route = stores whose own route
// it is, plus stores added to its visit list), biggest dues first.
export async function getAllRouteTotals(orgId: string): Promise<RouteTotal[]> {
  const db = getOrgScopedDb(orgId);
  const [routes, stores, listed, sums] = await Promise.all([
    db.route.findMany({ select: { id: true, name: true } }),
    db.store.findMany({ select: { id: true, routeId: true } }),
    db.routeStore.findMany({ select: { routeId: true, storeId: true } }),
    db.ledgerEntry.groupBy({ by: ["storeId"], _sum: { outstandingAmount: true } }),
  ]);
  const dueByStore = new Map(sums.map((s) => [s.storeId, Number(s._sum.outstandingAmount ?? 0)]));

  const storesOfRoute = new Map<string, Set<string>>();
  const add = (routeId: string | null, storeId: string) => {
    if (!routeId) return;
    if (!storesOfRoute.has(routeId)) storesOfRoute.set(routeId, new Set());
    storesOfRoute.get(routeId)!.add(storeId);
  };
  stores.forEach((s) => add(s.routeId, s.id));
  listed.forEach((r) => add(r.routeId, r.storeId));

  return routes
    .map((r) => {
      let total = 0;
      let partiesWithDues = 0;
      for (const storeId of storesOfRoute.get(r.id) ?? []) {
        const due = dueByStore.get(storeId) ?? 0;
        if (due > 0) {
          total += due;
          partiesWithDues += 1;
        }
      }
      return { routeId: r.id, name: r.name, total, partiesWithDues };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

export interface PartySearchResult extends PartyOutstanding {
  routeName: string | null;
}

// Find parties with dues by medical name, store code or route name — across
// every route, not just the caller's own.
export async function searchPartyOutstanding(orgId: string, query: string): Promise<PartySearchResult[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const db = getOrgScopedDb(orgId);

  const routes = await db.route.findMany({
    where: { name: { contains: term, mode: "insensitive" } },
    select: { id: true },
  });
  const stores = await db.store.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { externalCode: { contains: term, mode: "insensitive" } },
        ...(routes.length > 0 ? [{ routeId: { in: routes.map((r) => r.id) } }] : []),
      ],
    },
    select: { id: true, name: true, externalCode: true, route: { select: { name: true } } },
    take: 500,
  });
  if (stores.length === 0) return [];

  const sums = await db.ledgerEntry.groupBy({
    by: ["storeId"],
    where: { storeId: { in: stores.map((s) => s.id) } },
    _sum: { outstandingAmount: true },
    _count: true,
    _min: { invoiceDate: true },
  });
  const sumByStore = new Map(sums.map((s) => [s.storeId, s]));

  const results: PartySearchResult[] = [];
  for (const s of stores) {
    const row = sumByStore.get(s.id);
    const amount = Number(row?._sum.outstandingAmount ?? 0);
    if (amount <= 0) continue;
    results.push({
      storeId: s.id,
      name: s.name,
      externalCode: s.externalCode,
      outstanding: amount,
      bills: row?._count ?? 0,
      oldestBill: row?._min.invoiceDate ?? null,
      routeName: s.route?.name ?? null,
    });
  }
  return results.sort((a, b) => b.outstanding - a.outstanding).slice(0, 60);
}
