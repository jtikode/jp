"use client";

import { useState } from "react";
import { toggleTaskActive, renameTask, deleteTask } from "@/actions/taskActions";
import { InlineRenameButton } from "@/components/admin/InlineRenameButton";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { TaskForm, type TaskFormEmployee } from "@/components/admin/TaskForm";
import { TaskCompletionChart, type EmployeeCompletionPoint } from "@/components/charts/TaskCompletionChart";
import { TaskTrendChart } from "@/components/charts/TaskTrendChart";
import type { EmployeeTrends } from "@/lib/taskReporting";
import { clsx } from "@/lib/clsx";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface TaskRow {
  id: string;
  title: string;
  recurrence: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  scheduledTime: string | null;
  assignedLabel: string;
  active: boolean;
}

function describeRecurrence(task: { recurrence: string; dayOfWeek: number | null; dayOfMonth: number | null; scheduledTime: string | null }): string {
  let base: string;
  if (task.recurrence === "ONCE") base = "One-time";
  else if (task.recurrence === "DAILY") base = "Every day";
  else if (task.recurrence === "WEEKLY") base = `Every ${WEEKDAY_NAMES[task.dayOfWeek ?? 0]}`;
  else base = `Every month on the ${task.dayOfMonth}${task.dayOfMonth === 1 ? "st" : "th"}`;
  return task.scheduledTime ? `${base} at ${task.scheduledTime}` : base;
}

export function AdminTasksPanel({
  employees,
  tasks,
  chartData,
  trendsByEmployee,
}: {
  employees: TaskFormEmployee[];
  tasks: TaskRow[];
  chartData: EmployeeCompletionPoint[];
  trendsByEmployee: Record<string, EmployeeTrends>;
}) {
  const [tab, setTab] = useState<"manage" | "chart">("manage");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-200">
        {(
          [
            ["manage", "Manage Tasks"],
            ["chart", "Completion Report"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={clsx(
              "border-b-2 px-3 py-2 text-sm font-semibold",
              tab === key ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "manage" && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-base font-bold text-slate-900">Add a task</h2>
            <TaskForm employees={employees} />
          </div>

          <div className="overflow-x-auto">
            <h2 className="mb-3 text-base font-bold text-slate-900">All tasks</h2>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Assigned to</th>
                  <th className="py-2 pr-4">Repeats</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-900">{task.title}</td>
                    <td className="py-2 pr-4 text-slate-600">{task.assignedLabel}</td>
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
                      <div className="flex items-center gap-3">
                        <InlineRenameButton currentName={task.title} action={renameTask.bind(null, task.id)} />
                        <form action={toggleTaskActive.bind(null, task.id, !task.active)}>
                          <button type="submit" className="text-sm font-semibold text-blue-700 hover:underline">
                            {task.active ? "Pause" : "Resume"}
                          </button>
                        </form>
                        <ConfirmDeleteButton
                          action={deleteTask.bind(null, task.id)}
                          confirmMessage={`Delete the task "${task.title}"? This also removes its completion history. Use Pause instead to keep the history.`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      No tasks yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "chart" && (
        <div className="space-y-8">
          <div>
            <h2 className="mb-1 text-base font-bold text-slate-900">Trend: birds-eye view</h2>
            <p className="mb-3 text-sm text-slate-500">
              The whole team (or one person) over time, switch between weekly and monthly to spot
              whether completion is slipping.
            </p>
            <TaskTrendChart trendsByEmployee={trendsByEmployee} employees={employees} />
          </div>

          <div>
            <h2 className="mb-1 text-base font-bold text-slate-900">Last 30 days by employee</h2>
            <p className="mb-3 text-sm text-slate-500">
              Individually-assigned tasks only (role-wide tasks aren&rsquo;t attributed to one person
              unless someone actually completed them).
            </p>
            {chartData.length > 0 ? (
              <TaskCompletionChart data={chartData} />
            ) : (
              <p className="py-6 text-center text-slate-400">No task history yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
