import { getStartOfIstWeekUtc, getStartOfIstMonthUtc, getIstDateParts, makeIstDateUtc } from "@/lib/istTime";

export interface TrendPoint {
  label: string;
  approved: number;
  awaiting: number;
  missed: number;
}

export interface EmployeeTrends {
  weekly: TrendPoint[];
  monthly: TrendPoint[];
}

const WEEKS = 12;
const MONTHS = 6;

function weekLabel(weekStart: Date): string {
  return weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

function monthLabel(monthStart: Date): string {
  return monthStart.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

function emptyPoint(label: string): TrendPoint {
  return { label, approved: 0, awaiting: 0, missed: 0 };
}

// i months before an IST month-start instant — calendar-aware (months vary
// in length, so this can't be plain millisecond subtraction the way weeks can).
function monthsBefore(monthStart: Date, count: number): Date {
  const { year, month } = getIstDateParts(monthStart);
  const totalMonths = year * 12 + month - count;
  return makeIstDateUtc(Math.floor(totalMonths / 12), ((totalMonths % 12) + 12) % 12, 1);
}

/**
 * Builds the admin "birds-eye" weekly/monthly view: one bucketed dataset for
 * the whole org ("ALL") plus one per employee, so the same trend chart can
 * either show how the team as a whole is doing over time, or zero in on one
 * person. Bucketed by `originalDate` (when a task was ACTUALLY due), not
 * `scheduledDate` (which keeps advancing for a rolled-forward WEEKLY/MONTHLY
 * occurrence) — otherwise a long-overdue task would only ever show up in
 * today's bucket instead of the period it was actually missed in.
 *
 * Same attribution rule as the existing per-employee report: an
 * individually-assigned task always counts against that person; a role-wide
 * task only counts against whoever actually completed it (or nobody, for the
 * org-wide "ALL" bucket, if no one ever did).
 */
export function buildTaskTrends(
  occurrences: Array<{
    originalDate: Date;
    status: string;
    taskAssignedToId: string | null;
    completedById: string | null;
  }>,
  employeeIds: string[],
  now: Date,
): Record<string, EmployeeTrends> {
  const thisWeekStart = getStartOfIstWeekUtc(now);
  const weekStarts: Date[] = [];
  for (let i = WEEKS - 1; i >= 0; i--) {
    weekStarts.push(new Date(thisWeekStart.getTime() - i * 7 * 24 * 60 * 60 * 1000));
  }

  const thisMonthStart = getStartOfIstMonthUtc(now);
  const monthStarts: Date[] = [];
  for (let i = MONTHS - 1; i >= 0; i--) {
    monthStarts.push(monthsBefore(thisMonthStart, i));
  }

  const result: Record<string, EmployeeTrends> = {};
  const initBuckets = (key: string) => {
    result[key] = {
      weekly: weekStarts.map((w) => emptyPoint(weekLabel(w))),
      monthly: monthStarts.map((m) => emptyPoint(monthLabel(m))),
    };
  };
  initBuckets("ALL");
  for (const id of employeeIds) initBuckets(id);

  for (const o of occurrences) {
    const wIdx = weekStarts.findIndex((w) => w.getTime() === getStartOfIstWeekUtc(o.originalDate).getTime());
    const mIdx = monthStarts.findIndex((m) => m.getTime() === getStartOfIstMonthUtc(o.originalDate).getTime());
    if (wIdx === -1 && mIdx === -1) continue;

    const bucketKey: "approved" | "awaiting" | "missed" =
      o.status === "APPROVED" ? "approved" : o.status === "AWAITING_APPROVAL" ? "awaiting" : "missed";
    const responsibleUserId = o.taskAssignedToId ?? o.completedById ?? undefined;

    if (wIdx !== -1) {
      result.ALL.weekly[wIdx][bucketKey] += 1;
      if (responsibleUserId && result[responsibleUserId]) {
        result[responsibleUserId].weekly[wIdx][bucketKey] += 1;
      }
    }
    if (mIdx !== -1) {
      result.ALL.monthly[mIdx][bucketKey] += 1;
      if (responsibleUserId && result[responsibleUserId]) {
        result[responsibleUserId].monthly[mIdx][bucketKey] += 1;
      }
    }
  }

  return result;
}
