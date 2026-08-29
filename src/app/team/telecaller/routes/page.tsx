import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function TelecallerRoutesPage() {
  const session = await getSession();
  const db = getOrgScopedDb(session.orgId as string);

  const routes = await db.route.findMany({
    include: { _count: { select: { stores: true } }, callSchedule: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-md space-y-3">
      <h1 className="text-xl font-bold text-slate-900">Routes</h1>
      <p className="text-sm text-slate-500">Tap a route to see every retailer on it.</p>

      {routes.map((route) => (
        <Link key={route.id} href={`/team/telecaller/routes/${route.id}`}>
          <Card className="hover:bg-slate-50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{route.name}</p>
                <p className="text-sm text-slate-500">{route._count.stores} stores</p>
              </div>
              {route.callSchedule && (
                <span className="whitespace-nowrap rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                  {DAY_NAMES[route.callSchedule.dayOfWeek]}
                </span>
              )}
            </div>
          </Card>
        </Link>
      ))}
      {routes.length === 0 && <p className="py-6 text-center text-slate-400">No routes yet.</p>}
    </div>
  );
}
