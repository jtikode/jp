import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { CallScheduleForm } from "@/components/telecaller/CallScheduleForm";
import { removeRouteCallDay } from "@/actions/telecallerActions";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function TelecallerCalendarPage() {
  const session = await getSession();
  const db = getOrgScopedDb(session.orgId as string);

  const routes = await db.route.findMany({
    include: { callSchedule: true },
    orderBy: { name: "asc" },
  });

  const byDay = new Map<number, typeof routes>();
  for (let d = 0; d < 7; d++) byDay.set(d, []);
  const unassigned: typeof routes = [];
  for (const route of routes) {
    if (route.callSchedule) byDay.get(route.callSchedule.dayOfWeek)!.push(route);
    else unassigned.push(route);
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">Calling Calendar</h1>
        <p className="mt-1 text-sm text-slate-500">Which route to call on which day of the week.</p>
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-bold text-slate-900">Assign a route to a day</h2>
        <CallScheduleForm routes={routes.map((r) => ({ id: r.id, name: r.name }))} />
      </Card>

      {DAY_NAMES.map((dayName, dayIndex) => {
        const dayRoutes = byDay.get(dayIndex) ?? [];
        return (
          <Card key={dayName}>
            <h2 className="mb-2 text-base font-bold text-slate-900">{dayName}</h2>
            {dayRoutes.length === 0 && <p className="text-sm text-slate-400">No route assigned</p>}
            <div className="flex flex-col gap-2">
              {dayRoutes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between rounded-lg border-2 border-slate-200 p-2"
                >
                  <Link
                    href={`/team/telecaller/routes/${route.id}`}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    {route.name}
                  </Link>
                  <form action={removeRouteCallDay.bind(null, route.id)}>
                    <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">
                      Remove
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {unassigned.length > 0 && (
        <Card>
          <h2 className="mb-2 text-base font-bold text-slate-900">Not yet scheduled</h2>
          <div className="flex flex-col gap-2">
            {unassigned.map((route) => (
              <Link
                key={route.id}
                href={`/team/telecaller/routes/${route.id}`}
                className="text-sm font-medium text-slate-700 hover:underline"
              >
                {route.name}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
