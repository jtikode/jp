import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  subMonths,
  format,
  getDate,
  getDay,
  isSameDay,
} from "date-fns";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { DCRCalendarGrid, type DayCell } from "@/components/calendar/DCRCalendarGrid";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";

export default async function CalendarPage() {
  const session = await getSession();
  const userId = session.userId as string;
  const db = getOrgScopedDb(session.orgId as string);
  const lang = await getLang();

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = getDate(monthEnd);
  // Monday-first grid: convert JS Sunday=0 to 0=Monday..6=Sunday
  const leadingBlanks = (getDay(monthStart) + 6) % 7;

  const [attendances, visits, todayOrders, monthOrders, target] = await Promise.all([
    db.attendance.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
    }),
    db.visit.findMany({
      where: { userId, visitDate: { gte: monthStart, lte: monthEnd } },
      select: { visitDate: true, hasOrder: true },
    }),
    db.visit.aggregate({
      where: { userId, visitDate: { gte: startOfDay(today), lte: endOfDay(today) } },
      _sum: { orderAmount: true },
    }),
    db.visit.aggregate({
      where: { userId, visitDate: { gte: monthStart, lte: monthEnd } },
      _sum: { orderAmount: true },
    }),
    db.target.findUnique({
      where: {
        userId_periodMonth_periodYear: {
          userId,
          periodMonth: today.getMonth() + 1,
          periodYear: today.getFullYear(),
        },
      },
    }),
  ]);

  const todayOrderAmount = Number(todayOrders._sum.orderAmount ?? 0);
  const monthOrderAmount = Number(monthOrders._sum.orderAmount ?? 0);
  const todayTarget = Number(target?.todayTarget ?? 0);
  const monthlyTarget = Number(target?.monthlyTarget ?? 0);

  // Last 3 years (36 months) of this salesman's own history, fetched in one
  // query and bucketed in JS rather than 36 separate month-by-month queries.
  const threeYearsAgo = startOfMonth(subMonths(today, 35));
  const historyVisits = await db.visit.findMany({
    where: { userId, visitDate: { gte: threeYearsAgo } },
    select: { visitDate: true, orderAmount: true, collectionAmount: true, hasOrder: true },
  });

  const monthlyBuckets = new Map<
    string,
    { label: string; visits: number; productive: number; orderAmount: number; collection: number }
  >();
  for (let i = 0; i < 36; i++) {
    const d = subMonths(today, i);
    const key = format(d, "yyyy-MM");
    monthlyBuckets.set(key, {
      label: format(d, "MMM yyyy"),
      visits: 0,
      productive: 0,
      orderAmount: 0,
      collection: 0,
    });
  }
  for (const v of historyVisits) {
    const key = format(v.visitDate, "yyyy-MM");
    const bucket = monthlyBuckets.get(key);
    if (!bucket) continue;
    bucket.visits += 1;
    if (v.hasOrder) bucket.productive += 1;
    bucket.orderAmount += Number(v.orderAmount ?? 0);
    bucket.collection += Number(v.collectionAmount ?? 0);
  }
  const historyRows = [...monthlyBuckets.values()];

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
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <h1 className="mb-4 text-lg font-bold text-slate-900">
          {t(lang, "daily_call_report")} — {monthStart.toLocaleString("default", { month: "long", year: "numeric" })}
        </h1>
        <DCRCalendarGrid cells={cells} leadingBlanks={leadingBlanks} />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">{t(lang, "target_progress")}</h2>
        <div className="flex flex-col gap-4">
          <ProgressBar
            label={t(lang, "today")}
            achieved={todayOrderAmount}
            target={todayTarget}
            pctSuffix={t(lang, "of_target")}
          />
          <ProgressBar
            label={t(lang, "this_month")}
            achieved={monthOrderAmount}
            target={monthlyTarget}
            pctSuffix={t(lang, "of_target")}
          />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-1 text-lg font-bold text-slate-900">{t(lang, "three_year_history")}</h2>
        <p className="mb-4 text-sm text-slate-500">{t(lang, "monthly_numbers_recent")}</p>
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">{t(lang, "month")}</th>
              <th className="py-2 pr-4">{t(lang, "visits")}</th>
              <th className="py-2 pr-4">{t(lang, "productive")}</th>
              <th className="py-2 pr-4">{t(lang, "order_amt")}</th>
              <th className="py-2 pr-4">{t(lang, "collected")}</th>
            </tr>
          </thead>
          <tbody>
            {historyRows.map((row) => (
              <tr key={row.label} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{row.label}</td>
                <td className="py-2 pr-4 text-slate-600">{row.visits}</td>
                <td className="py-2 pr-4 text-slate-600">{row.productive}</td>
                <td className="py-2 pr-4 text-slate-600">
                  ₹{row.orderAmount.toLocaleString("en-IN")}
                </td>
                <td className="py-2 pr-4 text-slate-600">
                  ₹{row.collection.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
