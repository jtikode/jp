import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { getTodaysTasksForEmployee, getWeekProjectionForEmployee } from "@/lib/taskGeneration";
import { Card } from "@/components/ui/Card";
import { TaskList } from "@/components/tasks/TaskList";
import { WeekProjection } from "@/components/tasks/WeekProjection";
import { AddOwnTaskForm } from "@/components/tasks/AddOwnTaskForm";

export const dynamic = "force-dynamic";

export default async function BoardEmployeePage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await requireRole(["ADMIN", "SALESMAN", "TELECALLER", "WAREHOUSE"]);
  const { userId } = await params;
  if (session.role !== "ADMIN" && userId !== session.userId) redirect(`/team/board/${session.userId}`);
  const db = getOrgScopedDb(session.orgId);

  const employee = await db.user.findFirst({ where: { id: userId, active: true } });
  if (!employee) notFound();

  const [tasks, week] = await Promise.all([
    getTodaysTasksForEmployee(session.orgId, employee.id, employee.role),
    getWeekProjectionForEmployee(session.orgId, employee.id, employee.role),
  ]);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {session.role === "ADMIN" && (
        <Link
          href="/team/board"
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← All employees
        </Link>
      )}

      <Card>
        <h1 className="text-lg font-bold text-slate-900">{employee.name}&rsquo;s Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">Today</p>
      </Card>

      <Card>
        <TaskList tasks={tasks} employeeUserId={employee.id} />
        {employee.id === session.userId && (
          <div className="mt-5 border-t border-slate-200 pt-4">
            <h3 className="mb-1 text-base font-bold text-slate-900">Add your own task</h3>
            <p className="mb-3 text-sm text-slate-500">For something one-off, due today.</p>
            <AddOwnTaskForm />
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold text-slate-900">This week</h2>
        <WeekProjection days={week} />
      </Card>
    </div>
  );
}
