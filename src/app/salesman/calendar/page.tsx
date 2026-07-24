import { startOfMonth, endOfMonth, getDate, getDay, isSameDay } from "date-fns";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { DCRCalendarGrid, type DayCell } from "@/components/calendar/DCRCalendarGrid";

export default async function CalendarPage() {
  const session = await getSession();
  const userId = session.userId as string;

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = getDate(monthEnd);
  // Monday-first grid: convert JS Sunday=0 to 0=Monday..6=Sunday
  const leadingBlanks = (getDay(monthStart) + 6) % 7;

  const [attendances, visits] = await Promise.all([
    db.attendance.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
    }),
    db.visit.findMany({
      where: { userId, visitDate: { gte: monthStart, lte: monthEnd } },
      select: { visitDate: true, hasOrder: true },
    }),
  ]);

  const cells: DayCell[] = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(today.getFullYear(), today.getMonth(), day);

    const dayVisits = visits.filter((v) => isSameDay(v.visitDate, date));
    const totalCalls = dayVisits.length;
    const productiveCalls = dayVisits.filter((v) => v.hasOrder).length;

    const attendance = attendances.find((a) => isSameDay(a.date, date));
    const status = attendance?.status ?? (totalCalls > 0 ? "OFFICIAL_VISIT" : null);

    return { day, isToday: isSameDay(date, today), totalCalls, productiveCalls, status };
  });

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <h1 className="mb-4 text-lg font-bold text-slate-900">
          Daily Call Report — {monthStart.toLocaleString("default", { month: "long", year: "numeric" })}
        </h1>
        <DCRCalendarGrid cells={cells} leadingBlanks={leadingBlanks} />
      </Card>
    </div>
  );
}
