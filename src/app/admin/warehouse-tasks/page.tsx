import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { WarehouseTaskForm } from "@/components/admin/WarehouseTaskForm";
import { AddStockItemForm } from "@/components/admin/AddStockItemForm";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { toggleWarehouseTaskActive } from "@/actions/warehouseTaskActions";
import { deleteStockItem } from "@/actions/stockActions";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function describeRecurrence(task: {
  recurrence: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
}): string {
  if (task.recurrence === "WEEKLY") return `Every ${WEEKDAY_NAMES[task.dayOfWeek ?? 0]}`;
  return `Every month on the ${task.dayOfMonth}${task.dayOfMonth === 1 ? "st" : "th"}`;
}

export default async function AdminWarehouseTasksPage() {
  const [tasks, stockItems] = await Promise.all([
    db.warehouseTask.findMany({ orderBy: { createdAt: "desc" } }),
    db.stockItem.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Add recurring task</h2>
        <WarehouseTaskForm />
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-4 text-lg font-bold text-slate-900">All tasks</h2>
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Repeats</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{task.title}</td>
                <td className="py-2 pr-4 text-slate-600">{describeRecurrence(task)}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      task.active
                        ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                        : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500"
                    }
                  >
                    {task.active ? "Active" : "Paused"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <form action={toggleWarehouseTaskActive.bind(null, task.id, !task.active)}>
                    <button type="submit" className="text-sm font-semibold text-blue-700 hover:underline">
                      {task.active ? "Pause" : "Resume"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">
                  No tasks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Add stock sheet item</h2>
        <AddStockItemForm />
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Stock sheet items</h2>
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {stockItems.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{item.name}</td>
                <td className="py-2 pr-4">
                  <ConfirmDeleteButton
                    action={deleteStockItem.bind(null, item.id)}
                    confirmMessage={`Remove "${item.name}" from the stock sheet? Past counts for it are deleted too.`}
                  />
                </td>
              </tr>
            ))}
            {stockItems.length === 0 && (
              <tr>
                <td colSpan={2} className="py-4 text-center text-slate-400">
                  No stock items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
