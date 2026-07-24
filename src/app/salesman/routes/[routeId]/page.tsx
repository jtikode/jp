import { notFound } from "next/navigation";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
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

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <h1 className="mb-1 text-lg font-bold text-slate-900">{route.name}</h1>
        <p className="mb-4 text-sm text-slate-500">Monthly visit history</p>
        <RouteBarChart data={monthlyData} />
      </Card>
    </div>
  );
}
