import Link from "next/link";
import { startOfMonth, endOfMonth, getDate, getDay } from "date-fns";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { DCRCalendarGrid } from "@/components/calendar/DCRCalendarGrid";
import { buildMonthCells } from "@/lib/dcrCalendar";

export const dynamic = "force-dynamic";

// Admin's at-a-glance view of every salesman's month — same DCR grid each
// salesman sees for themselves at /team/salesman/calendar, just all of them
// side by side instead of scoped to one person.
export default async function AdminCalendarPage() {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = getDate(monthEnd);
  const leadingBlanks = (getDay(monthStart) + 6) % 7;

  const salesmen = await db.user.findMany({
    where: { role: "SALESMAN", active: true },
    orderBy: { name: "asc" },
  });

  const rows = await Promise.all(
    salesmen.map(async (s) => ({
      user: s,
      cells: await buildMonthCells(db, s.id, monthStart, monthEnd, today, daysInMonth),
    })),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/team/admin/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        ← Home
      </Link>

      <Card>
        <h1 className="text-xl font-bold text-slate-900">
          All Salesmen — {monthStart.toLocaleString("default", { month: "long", year: "numeric" })}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Each salesman&rsquo;s own daily call report calendar, side by side.
        </p>
      </Card>

      {rows.map(({ user, cells }) => (
        <Card key={user.id}>
          <h2 className="mb-3 text-base font-bold text-slate-900">{user.name}</h2>
          <DCRCalendarGrid cells={cells} leadingBlanks={leadingBlanks} />
        </Card>
      ))}

      {rows.length === 0 && (
        <Card>
          <p className="py-6 text-center text-slate-400">No active salesmen yet.</p>
        </Card>
      )}
    </div>
  );
}
