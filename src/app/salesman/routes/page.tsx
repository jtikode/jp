import Link from "next/link";
import { startOfMonth, endOfMonth } from "date-fns";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";

export default async function SalesmanRoutesPage() {
  const session = await getSession();
  const userId = session.userId as string;

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const assignments = await db.routeAssignment.findMany({
    where: { userId },
    include: { route: true },
  });

  const visits = await db.visit.findMany({
    where: { userId, visitDate: { gte: monthStart, lte: monthEnd } },
    select: { routeId: true, visitDate: true },
  });

  const usageByRoute = new Map<string, Set<string>>();
  for (const v of visits) {
    if (!v.routeId) continue;
    const dayKey = v.visitDate.toDateString();
    if (!usageByRoute.has(v.routeId)) usageByRoute.set(v.routeId, new Set());
    usageByRoute.get(v.routeId)!.add(dayKey);
  }

  return (
    <div className="mx-auto max-w-md space-y-3">
      <h1 className="text-xl font-bold text-slate-900">My Routes</h1>
      {assignments.map(({ route }) => (
        <Link key={route.id} href={`/salesman/routes/${route.id}`}>
          <Card className="flex items-center justify-between hover:bg-slate-50">
            <div>
              <p className="font-semibold text-slate-900">{route.name}</p>
              {route.description && <p className="text-sm text-slate-500">{route.description}</p>}
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
              {usageByRoute.get(route.id)?.size ?? 0}x this month
            </span>
          </Card>
        </Link>
      ))}
      {assignments.length === 0 && (
        <Card>
          <p className="text-center text-slate-400">No routes assigned yet.</p>
        </Card>
      )}
    </div>
  );
}
