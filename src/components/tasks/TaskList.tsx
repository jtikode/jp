"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markTaskComplete } from "@/actions/taskActions";
import { Button } from "@/components/ui/Button";

export interface TaskListItem {
  occurrenceId: string;
  title: string;
  description: string | null;
  recurrence: string;
  scheduledTime: string | null;
  status: string;
}

const RECURRENCE_LABEL: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  ONCE: "One-time",
};
const RECURRENCE_BADGE: Record<string, string> = {
  DAILY: "bg-blue-100 text-blue-700",
  WEEKLY: "bg-purple-100 text-purple-700",
  MONTHLY: "bg-teal-100 text-teal-700",
  ONCE: "bg-slate-100 text-slate-600",
};

// Shared by an employee's own dashboard (warehouse today) and the shared
// board — employeeUserId is who the completion is recorded against, which
// on the board is whichever tile was tapped, not necessarily the device's
// own login. Tasks arrive pre-sorted (daily, then weekly, then monthly/once).
export function TaskList({ tasks, employeeUserId }: { tasks: TaskListItem[]; employeeUserId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function complete(occurrenceId: string) {
    startTransition(async () => {
      await markTaskComplete(occurrenceId, employeeUserId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => (
        <div
          key={t.occurrenceId}
          className="flex items-center gap-3 rounded-xl border-2 border-slate-200 p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-900">
              <span>{t.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${RECURRENCE_BADGE[t.recurrence]}`}>
                {RECURRENCE_LABEL[t.recurrence]}
              </span>
              {t.scheduledTime && (
                <span className="text-xs font-medium text-slate-500">🕐 {t.scheduledTime}</span>
              )}
            </p>
            {t.description && <p className="text-sm text-slate-500">{t.description}</p>}
          </div>

          {(t.status === "PENDING" || t.status === "REJECTED") && (
            <div className="flex shrink-0 flex-col items-end gap-1">
              {t.status === "REJECTED" && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                  Sent back — redo
                </span>
              )}
              <Button
                disabled={pending}
                onClick={() => complete(t.occurrenceId)}
                className="min-h-11 px-4 py-2 text-sm"
              >
                Done
              </Button>
            </div>
          )}
          {t.status === "AWAITING_APPROVAL" && (
            <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
              Awaiting approval
            </span>
          )}
          {t.status === "APPROVED" && (
            <span className="shrink-0 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
              ✓ Approved
            </span>
          )}
        </div>
      ))}
      {tasks.length === 0 && <p className="py-6 text-center text-slate-400">No tasks due today.</p>}
    </div>
  );
}
