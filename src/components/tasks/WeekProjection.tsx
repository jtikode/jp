import type { ProjectedDay } from "@/lib/taskGeneration";

const RECURRENCE_LABEL: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  ONCE: "One-time",
};

// The next 7 days of an employee's tasks, worked out from each task's repeat
// rule. Read-only: today's tasks are completed from the Today list above.
export function WeekProjection({ days }: { days: ProjectedDay[] }) {
  const anything = days.some((d) => d.tasks.length > 0);
  if (!anything) return <p className="py-4 text-center text-slate-400">No tasks planned for the next 7 days.</p>;

  return (
    <div className="flex flex-col gap-2">
      {days.map((d, i) => (
        <div key={d.date.toISOString()} className="rounded-xl border border-slate-200 p-3">
          <p className="text-sm font-bold text-slate-900">
            {i === 0 ? "Today" : i === 1 ? "Tomorrow" : ""}
            {i > 1 ? "" : " · "}
            {d.date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
          </p>
          {d.tasks.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing due</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {d.tasks.map((t) => (
                <li key={t.taskId} className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                  <span>{t.title}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {RECURRENCE_LABEL[t.recurrence] ?? t.recurrence}
                  </span>
                  {t.scheduledTime && <span className="text-xs text-slate-500">🕐 {t.scheduledTime}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
