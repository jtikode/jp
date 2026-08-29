import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { ensureTodaysOccurrences } from "@/lib/taskGeneration";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  SALESMAN: "Salesman",
  TELECALLER: "Telecaller",
  WAREHOUSE: "Warehouse",
};

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// The shared kiosk/office-screen board. Anyone logged in as any staff role
// can operate it — there's no per-employee login on this screen, so
// identity comes from tapping a name, not from the device's own session.
export default async function BoardPage() {
  const session = await requireRole(["ADMIN", "SALESMAN", "TELECALLER", "WAREHOUSE"]);
  const db = getOrgScopedDb(session.orgId);
  await ensureTodaysOccurrences(session.orgId);
  const today = startOfToday();

  const [users, occurrences] = await Promise.all([
    db.user.findMany({ where: { active: true }, orderBy: [{ role: "asc" }, { name: "asc" }] }),
    db.taskOccurrence.findMany({
      where: { scheduledDate: today },
      include: { task: true },
    }),
  ]);

  const counts = new Map<string, { pending: number; total: number }>();
  for (const u of users) {
    const relevant = occurrences.filter(
      (o) => o.task.assignedToId === u.id || (o.task.assignedToId == null && o.task.assignedRole === u.role),
    );
    counts.set(u.id, {
      pending: relevant.filter((o) => o.status === "PENDING" || o.status === "REJECTED").length,
      total: relevant.length,
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">Today&rsquo;s Tasks Board</h1>
        <p className="mt-1 text-sm text-slate-500">Tap your name to see and complete today&rsquo;s tasks.</p>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {users.map((u) => {
          const c = counts.get(u.id)!;
          return (
            <Link
              key={u.id}
              href={`/team/board/${u.id}`}
              className="rounded-xl border-2 border-slate-200 bg-white p-4 hover:border-blue-400"
            >
              <p className="font-bold text-slate-900">{u.name}</p>
              <p className="text-xs text-slate-500">{ROLE_LABELS[u.role] ?? u.role}</p>
              <p className="mt-2 text-sm">
                {c.total === 0 ? (
                  <span className="text-slate-400">No tasks today</span>
                ) : c.pending === 0 ? (
                  <span className="font-semibold text-green-700">All done ✓</span>
                ) : (
                  <span className="font-semibold text-amber-700">{c.pending} pending</span>
                )}
              </p>
            </Link>
          );
        })}
        {users.length === 0 && (
          <p className="col-span-full py-6 text-center text-slate-400">No active employees yet.</p>
        )}
      </div>
    </div>
  );
}
