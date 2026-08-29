import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { getTodaysTasksForEmployee } from "@/lib/taskGeneration";
import { WarehouseAttendanceButtons } from "@/components/warehouse/WarehouseAttendanceButtons";
import { TaskList } from "@/components/tasks/TaskList";
import { AddOwnTaskForm } from "@/components/warehouse/AddOwnTaskForm";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default async function WarehouseDashboardPage() {
  const session = await getSession();
  const userId = session.userId as string;
  const orgId = session.orgId as string;
  const db = getOrgScopedDb(orgId);

  const [tasks, attendance] = await Promise.all([
    getTodaysTasksForEmployee(orgId, userId, "WAREHOUSE"),
    db.attendance.findUnique({
      where: { userId_date: { userId, date: startOfToday() } },
    }),
  ]);

  const present = attendance?.status !== "ABSENT";

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <h1 className="mb-4 text-lg font-bold text-slate-900">Today&apos;s Attendance</h1>
        <WarehouseAttendanceButtons present={present} />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Today&apos;s Tasks</h2>
        <p className="mb-4 text-sm text-slate-500">
          Mark a task done and it goes to your admin for approval.
        </p>
        <TaskList tasks={tasks} employeeUserId={userId} />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Add Your Own Task</h2>
        <p className="mb-4 text-sm text-slate-500">For something one-off, due today.</p>
        <AddOwnTaskForm />
      </Card>
    </div>
  );
}
