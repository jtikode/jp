import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { getTodaysTaskOccurrences } from "@/lib/warehouseTasks";
import { WarehouseAttendanceButtons } from "@/components/warehouse/WarehouseAttendanceButtons";
import { WarehouseTaskList } from "@/components/warehouse/WarehouseTaskList";
import { AddOwnTaskForm } from "@/components/warehouse/AddOwnTaskForm";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default async function WarehouseDashboardPage() {
  const session = await getSession();
  const userId = session.userId as string;

  const [occurrences, attendance] = await Promise.all([
    getTodaysTaskOccurrences(),
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
          Anyone on shift can complete these. Unfinished tasks roll to tomorrow automatically.
        </p>
        <WarehouseTaskList
          occurrences={occurrences.map((o) => ({
            id: o.id,
            title: o.task.title,
            description: o.task.description,
            overdue: o.originalDate.getTime() < startOfToday().getTime(),
          }))}
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Add Your Own Task</h2>
        <p className="mb-4 text-sm text-slate-500">For something one-off, due today.</p>
        <AddOwnTaskForm />
      </Card>
    </div>
  );
}
