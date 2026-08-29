"use client";

import { useState } from "react";
import { toggleTaskActive, approveTaskOccurrence, rejectTaskOccurrence } from "@/actions/taskActions";
import { TaskForm, type TaskFormEmployee } from "@/components/admin/TaskForm";
import { TaskCompletionChart, type EmployeeCompletionPoint } from "@/components/charts/TaskCompletionChart";
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

export interface ApprovalRow {
  occurrenceId: string;
  taskTitle: string;
  employeeName: string;
  completedAt: string;
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
  approvals,
  chartData,
}: {
  employees: TaskFormEmployee[];
  tasks: TaskRow[];
  approvals: ApprovalRow[];
  chartData: EmployeeCompletionPoint[];
}) {
  const [tab, setTab] = useState<"manage" | "approvals" | "chart">(
    approvals.length > 0 ? "approvals" : "manage",
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-200">
        {(
          [
            ["manage", "Manage Tasks"],
            ["approvals", `Approvals${approvals.length > 0 ? ` (${approvals.length})` : ""}`],
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
            <table className="w-full min-w-[600px] text-left text-sm">
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
                      <form action={toggleTaskActive.bind(null, task.id, !task.active)}>
                        <button type="submit" className="text-sm font-semibold text-blue-700 hover:underline">
                          {task.active ? "Pause" : "Resume"}
                        </button>
                      </form>
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

      {tab === "approvals" && (
        <div className="flex flex-col gap-2">
          {approvals.map((a) => (
            <div
              key={a.occurrenceId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-3"
            >
              <div>
                <p className="font-semibold text-slate-900">{a.taskTitle}</p>
                <p className="text-sm text-slate-600">
                  {a.employeeName} · marked done {a.completedAt}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={approveTaskOccurrence.bind(null, a.occurrenceId)}>
                  <button
                    type="submit"
                    className="rounded-lg bg-green-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-green-800"
                  >
                    Approve
                  </button>
                </form>
                <form action={rejectTaskOccurrence.bind(null, a.occurrenceId)}>
                  <button
                    type="submit"
                    className="rounded-lg border-2 border-red-700 px-3 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
          {approvals.length === 0 && (
            <p className="py-6 text-center text-slate-400">Nothing waiting for approval.</p>
          )}
        </div>
      )}

      {tab === "chart" && (
        <div>
          <p className="mb-3 text-sm text-slate-500">
            Last 30 days, individually-assigned tasks only (role-wide tasks aren&rsquo;t attributed to one
            person unless someone actually completed them).
          </p>
          {chartData.length > 0 ? (
            <TaskCompletionChart data={chartData} />
          ) : (
            <p className="py-6 text-center text-slate-400">No task history yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
