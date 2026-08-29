import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { AdminTasksPanel, type ApprovalRow, type TaskRow } from "@/components/admin/AdminTasksPanel";
import type { EmployeeCompletionPoint } from "@/components/charts/TaskCompletionChart";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  SALESMAN: "All Salesmen",
  TELECALLER: "All Telecallers",
  WAREHOUSE: "All Warehouse Staff",
  ADMIN: "All Admins",
};

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default async function AdminTasksPage() {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);
  const today = startOfToday();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [users, tasks, awaitingOccurrences, historyOccurrences] = await Promise.all([
    db.user.findMany({ where: { active: true }, orderBy: [{ role: "asc" }, { name: "asc" }] }),
    db.task.findMany({ include: { assignedTo: true }, orderBy: { createdAt: "desc" } }),
    db.taskOccurrence.findMany({
      where: { status: "AWAITING_APPROVAL" },
      include: { task: true },
      orderBy: { completedAt: "asc" },
    }),
    db.taskOccurrence.findMany({
      where: { scheduledDate: { gte: thirtyDaysAgo, lt: today } },
      include: { task: true },
    }),
  ]);

  const userNameById = new Map(users.map((u) => [u.id, u.name]));

  const taskRows: TaskRow[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    recurrence: t.recurrence,
    dayOfWeek: t.dayOfWeek,
    dayOfMonth: t.dayOfMonth,
    scheduledTime: t.scheduledTime,
    assignedLabel: t.assignedToId
      ? (t.assignedTo?.name ?? "Unknown")
      : (ROLE_LABELS[t.assignedRole ?? ""] ?? "Unassigned"),
    active: t.active,
  }));

  const approvalRows: ApprovalRow[] = awaitingOccurrences.map((o) => ({
    occurrenceId: o.id,
    taskTitle: o.task.title,
    employeeName: (o.completedById && userNameById.get(o.completedById)) ?? "Unknown",
    completedAt: o.completedAt ? o.completedAt.toLocaleString("en-IN") : "",
  }));

  // Only occurrences with a determinate responsible person: an individually
  // assigned task (always attributable), or a role-wide task someone
  // actually completed (credit goes to whoever did it). A role-wide task
  // nobody touched has no single person to blame, so it's left out.
  const buckets = new Map<string, { approved: number; awaiting: number; missed: number }>();
  for (const o of historyOccurrences) {
    const responsibleUserId = o.task.assignedToId ?? o.completedById ?? undefined;
    if (!responsibleUserId) continue;

    const bucket = buckets.get(responsibleUserId) ?? { approved: 0, awaiting: 0, missed: 0 };
    if (o.status === "APPROVED") bucket.approved += 1;
    else if (o.status === "AWAITING_APPROVAL") bucket.awaiting += 1;
    else bucket.missed += 1;
    buckets.set(responsibleUserId, bucket);
  }

  const chartData: EmployeeCompletionPoint[] = [...buckets.entries()]
    .map(([userId, counts]) => ({ name: userNameById.get(userId) ?? "Unknown", ...counts }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/team/admin/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        ← Home
      </Link>

      <Card>
        <h1 className="text-xl font-bold text-slate-900">Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">
          Assign tasks to a specific employee or a whole team, review completions waiting for
          approval, and see each employee&rsquo;s completion history. Staff mark tasks done from{" "}
          <Link href="/team/board" className="font-semibold text-blue-700 hover:underline">
            the shared board
          </Link>
          .
        </p>
      </Card>

      <Card>
        <AdminTasksPanel
          employees={users.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
          tasks={taskRows}
          approvals={approvalRows}
          chartData={chartData}
        />
      </Card>
    </div>
  );
}
