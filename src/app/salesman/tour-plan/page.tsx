import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { Card } from "@/components/ui/Card";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
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
  const [yearStr, monthNumStr] = (monthParam ?? format(now, "yyyy-MM")).split("-");
  const year = Number(yearStr) || now.getFullYear();
  const monthIndex = (Number(monthNumStr) || now.getMonth() + 1) - 1;
  const anchor = new Date(year, monthIndex, 1);
  const monthValue = format(anchor, "yyyy-MM");

  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

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

  const existingByDate = new Map(existing.map((a) => [format(a.date, "yyyy-MM-dd"), a]));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "tour_plan_heading")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t(lang, "tour_plan_subtitle")}</p>
      </Card>

      <TourPlanGrid
        lang={lang}
        monthValue={monthValue}
        days={days.map((d) => ({
          date: format(d, "yyyy-MM-dd"),
          dayOfWeek: d.getDay(),
          existing: existingByDate.get(format(d, "yyyy-MM-dd"))
            ? {
                routeId: existingByDate.get(format(d, "yyyy-MM-dd"))!.routeId ?? "",
                workingWithUserId: existingByDate.get(format(d, "yyyy-MM-dd"))!.workingWithUserId ?? "",
                note: existingByDate.get(format(d, "yyyy-MM-dd"))!.note ?? "",
              }
            : undefined,
        }))}
        routes={assignments.map((a) => ({ id: a.route.id, name: a.route.name }))}
        colleagues={colleagues.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
