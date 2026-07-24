import Link from "next/link";
import { notFound } from "next/navigation";
import { subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay, format } from "date-fns";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { RouteBarChart, type MonthlyPoint } from "@/components/charts/RouteBarChart";

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const { routeId } = await params;
  const session = await getSession();
  const userId = session.userId as string;

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

  const [stores, visitedTodayRows] = await Promise.all([
    db.store.findMany({
      where: { routeId },
      orderBy: [{ visitSequence: { sort: "asc", nulls: "last" } }, { name: "asc" }],
    }),
    db.visit.findMany({
      where: { userId, routeId, visitDate: { gte: startOfDay(today), lte: endOfDay(today) } },
      select: { storeId: true },
    }),
  ]);
  const visitedTodayIds = new Set(visitedTodayRows.map((v) => v.storeId));

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <h1 className="mb-1 text-lg font-bold text-slate-900">{route.name}</h1>
        <p className="mb-4 text-sm text-slate-500">Monthly visit history</p>
        <RouteBarChart data={monthlyData} />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Today&apos;s Visit Order</h2>
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
                <Link href={`/salesman/stores/${store.id}/visit`} className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                    {store.name}
                    {located && (
                      <span title="Location already marked" aria-label="Location already marked">
                        📍
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">{store.address}</p>
                </Link>
                {located && (
                  <a
                    href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Map
                  </a>
                )}
                {visited && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                    Visited
                  </span>
                )}
              </div>
            );
          })}
          {stores.length === 0 && (
            <p className="py-4 text-center text-slate-400">No stores on this route yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
