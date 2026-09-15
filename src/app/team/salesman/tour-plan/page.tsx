import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { Card } from "@/components/ui/Card";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import {
  getIstDateParts,
  getIstNow,
  getIstMonthKey,
  makeIstDateUtc,
  getStartOfIstMonthUtc,
  getEndOfIstMonthUtc,
} from "@/lib/istTime";
import { TourPlanGrid } from "@/components/salesman/TourPlanGrid";

export default async function TourPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const session = await getSession();
  const userId = session.userId as string;
  const db = getOrgScopedDb(session.orgId as string);
  const lang = await getLang();

  const now = new Date();
  const { year: nowYear, month: nowMonth } = getIstDateParts(now);
  const [yearStr, monthNumStr] = (monthParam ?? getIstMonthKey(now)).split("-");
  const year = Number(yearStr) || nowYear;
  const monthIndex = (Number(monthNumStr) || nowMonth + 1) - 1;
  const anchor = makeIstDateUtc(year, monthIndex, 1);
  const monthValue = getIstMonthKey(anchor);

  const monthStart = getStartOfIstMonthUtc(anchor);
  const monthEnd = getEndOfIstMonthUtc(anchor);
  const days: Date[] = [];
  for (let t = monthStart.getTime(); t <= monthEnd.getTime(); t += 24 * 60 * 60 * 1000) {
    days.push(new Date(t));
  }

  const [assignments, colleagues, existing] = await Promise.all([
    db.routeAssignment.findMany({ where: { userId }, include: { route: true } }),
    db.user.findMany({
      where: { active: true, id: { not: userId }, role: { in: ["SALESMAN", "TELECALLER"] } },
      orderBy: { name: "asc" },
    }),
    db.attendance.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
    }),
  ]);

  const existingByDate = new Map(existing.map((a) => [getIstNow(a.date).dateKey, a]));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "tour_plan_heading")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t(lang, "tour_plan_subtitle")}</p>
      </Card>

      <TourPlanGrid
        lang={lang}
        monthValue={monthValue}
        days={days.map((d) => {
          const dateStr = getIstNow(d).dateKey;
          const existingForDay = existingByDate.get(dateStr);
          return {
            date: dateStr,
            dayOfWeek: getIstNow(d).dayOfWeek,
            existing: existingForDay
              ? {
                  routeId: existingForDay.routeId ?? "",
                  workingWithUserId: existingForDay.workingWithUserId ?? "",
                  note: existingForDay.note ?? "",
                }
              : undefined,
          };
        })}
        routes={assignments.map((a) => ({ id: a.route.id, name: a.route.name }))}
        colleagues={colleagues.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
