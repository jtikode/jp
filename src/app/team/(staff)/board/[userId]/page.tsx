import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { getTodaysTasksForEmployee } from "@/lib/taskGeneration";
import { Card } from "@/components/ui/Card";
import { TaskList } from "@/components/tasks/TaskList";

export const dynamic = "force-dynamic";

export default async function BoardEmployeePage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await requireRole(["ADMIN", "SALESMAN", "TELECALLER", "WAREHOUSE"]);
  const { userId } = await params;
  const db = getOrgScopedDb(session.orgId);

  const employee = await db.user.findFirst({ where: { id: userId, active: true } });
  if (!employee) notFound();

  const tasks = await getTodaysTasksForEmployee(session.orgId, employee.id, employee.role);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link
        href="/team/board"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        ← All employees
      </Link>

      <Card>
        <h1 className="text-lg font-bold text-slate-900">{employee.name}&rsquo;s Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">Today</p>
      </Card>

      <Card>
        <TaskList tasks={tasks} employeeUserId={employee.id} />
      </Card>
    </div>
  );
}
