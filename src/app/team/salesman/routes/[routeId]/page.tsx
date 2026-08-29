import Link from "next/link";
import { notFound } from "next/navigation";
import { subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay, format } from "date-fns";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { RouteBarChart, type MonthlyPoint } from "@/components/charts/RouteBarChart";
import { storeLabel } from "@/lib/storeLabel";
import { VisitHistoryDots } from "@/components/salesman/VisitHistoryDots";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const { routeId } = await params;
  const session = await getSession();
  const userId = session.userId as string;
  const db = getOrgScopedDb(session.orgId as string);
  const lang = await getLang();

  const route = await db.route.findUnique({ where: { id: routeId } });
  if (!route) notFound();

  const today = new Date();
  const monthlyData: MonthlyPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(today, i);
    const from = startOfMonth(monthDate);
    const to = endOfMonth(monthDate);

    const visits = await db.visit.findMany({
      where: { userId, routeId, visitDate: { gte: from, lte: to } },
      select: { collectionAmount: true },
    });

    const collection = visits.reduce((sum, v) => sum + Number(v.collectionAmount ?? 0), 0);

    monthlyData.push({
      month: format(monthDate, "MMM"),
      visits: visits.length,
      collection,
    });
  }

  const [routeStores, visitedTodayRows] = await Promise.all([
    db.routeStore.findMany({
      where: { routeId },
      include: { store: true },
      orderBy: [{ visitSequence: { sort: "asc", nulls: "last" } }, { store: { name: "asc" } }],
    }),
    db.visit.findMany({
      where: { userId, routeId, visitDate: { gte: startOfDay(today), lte: endOfDay(today) } },
      select: { storeId: true },
    }),
  ]);
  const stores = routeStores.map((rs) => rs.store);
  const visitedTodayIds = new Set(visitedTodayRows.map((v) => v.storeId));

  const lastCallByStore = new Map<string, Date>();
  const visitHistoryByStore = new Map<string, boolean[]>();
  if (stores.length > 0) {
    const storeIds = stores.map((s) => s.id);
    const [lastCalls, recentVisits] = await Promise.all([
      db.telecallerLog.groupBy({
        by: ["storeId"],
        where: { storeId: { in: storeIds } },
        _max: { contactDate: true },
      }),
      // Fetched newest-first across all these stores in one query, then
      // sliced to the first 10 encountered per store below — cheaper than
      // one "last 10" query per store.
      db.visit.findMany({
        where: { storeId: { in: storeIds } },
        orderBy: { visitDate: "desc" },
        select: { storeId: true, hasOrder: true },
        take: 1000,
      }),
    ]);
    for (const c of lastCalls) {
      if (c._max.contactDate) lastCallByStore.set(c.storeId, c._max.contactDate);
    }
    for (const v of recentVisits) {
      const list = visitHistoryByStore.get(v.storeId) ?? [];
      if (list.length < 10) {
        list.push(v.hasOrder);
        visitHistoryByStore.set(v.storeId, list);
      }
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <h1 className="mb-1 text-lg font-bold text-slate-900">{route.name}</h1>
        <p className="mb-4 text-sm text-slate-500">{t(lang, "monthly_visit_history")}</p>
        <RouteBarChart data={monthlyData} />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">{t(lang, "todays_visit_order")}</h2>
        <div className="flex flex-col gap-2">
          {stores.map((store, i) => {
            const visited = visitedTodayIds.has(store.id);
            const located = store.latitude != null && store.longitude != null;
            return (
              <div
                key={store.id}
                className="flex items-center gap-3 rounded-xl border-2 border-slate-200 p-3 hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                  {i + 1}
                </span>
                <Link href={`/team/salesman/stores/${store.id}/visit`} className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                    {storeLabel(store.name, store.externalCode)}
                    {located && (
                      <span title={t(lang, "location_marked")} aria-label={t(lang, "location_marked")}>
                        📍
                      </span>
                    )}
                    <VisitHistoryDots history={visitHistoryByStore.get(store.id) ?? []} />
                  </p>
                  <p className="text-sm text-slate-500">{store.address}</p>
                  {lastCallByStore.has(store.id) && (
                    <p className="text-xs font-medium text-blue-700">
                      {t(lang, "tele_called")} {lastCallByStore.get(store.id)!.toLocaleDateString("en-IN")}
                    </p>
                  )}
                </Link>
                {located && (
                  <a
                    href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-semibold text-blue-700 hover:underline"
                  >
                    {t(lang, "map")}
                  </a>
                )}
                {visited && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                    {t(lang, "visited")}
                  </span>
                )}
              </div>
            );
          })}
          {stores.length === 0 && (
            <p className="py-4 text-center text-slate-400">{t(lang, "no_stores_on_route")}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
