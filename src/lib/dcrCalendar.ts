import { isSameDay } from "date-fns";
import type { getOrgScopedDb } from "@/lib/orgScopedDb";
import type { DayCell } from "@/components/calendar/DCRCalendarGrid";

// Shared with both the salesman's own calendar and the admin's all-salesmen
// calendar — one month of attendance + visit activity, cell-per-day.
export async function buildMonthCells(
  db: ReturnType<typeof getOrgScopedDb>,
  userId: string,
  monthStart: Date,
  monthEnd: Date,
  today: Date,
  daysInMonth: number,
): Promise<DayCell[]> {
  const [attendances, visits] = await Promise.all([
    db.attendance.findMany({ where: { userId, date: { gte: monthStart, lte: monthEnd } } }),
    db.visit.findMany({
      where: { userId, visitDate: { gte: monthStart, lte: monthEnd } },
      select: { visitDate: true, hasOrder: true },
    }),
  ]);

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);

    const dayVisits = visits.filter((v) => isSameDay(v.visitDate, date));
    const totalCalls = dayVisits.length;
    const productiveCalls = dayVisits.filter((v) => v.hasOrder).length;

    const attendance = attendances.find((a) => isSameDay(a.date, date));
    const status = attendance?.status ?? (totalCalls > 0 ? "OFFICIAL_VISIT" : null);

    return { day, isToday: isSameDay(date, today), totalCalls, productiveCalls, status };
  });
}
