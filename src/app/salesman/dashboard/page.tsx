import Link from "next/link";
import { startOfMonth, endOfMonth } from "date-fns";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { AttendanceButtons } from "@/components/salesman/AttendanceButtons";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";

function formatCurrency(lang: "en" | "mr", value: number | null | undefined): string {
  if (value == null) return t(lang, "not_set");
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export default async function SalesmanDashboardPage() {
  const session = await getSession();
  const userId = session.userId as string;
  const lang = await getLang();
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const [target, assignments, attendance, visits, incentiveItems] = await Promise.all([
    db.target.findUnique({
      where: {
        userId_periodMonth_periodYear: {
          userId,
          periodMonth: today.getMonth() + 1,
          periodYear: today.getFullYear(),
        },
      },
    }),
    db.routeAssignment.findMany({
      where: { userId },
      include: { route: true },
    }),
    db.attendance.findUnique({
      where: { userId_date: { userId, date: startOfToday } },
    }),
    db.visit.findMany({
      where: { userId, visitDate: { gte: monthStart, lte: monthEnd } },
      select: { routeId: true, visitDate: true },
    }),
    db.incentiveItem.findMany({ orderBy: { incentiveAmount: "desc" } }),
  ]);

  const usageByRoute = new Map<string, Set<string>>();
  for (const v of visits) {
    if (!v.routeId) continue;
    const dayKey = v.visitDate.toDateString();
    if (!usageByRoute.has(v.routeId)) usageByRoute.set(v.routeId, new Set());
    usageByRoute.get(v.routeId)!.add(dayKey);
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link href="/salesman/july-catchup">
        <Card className="border-amber-300 bg-amber-50 hover:bg-amber-100">
          <p className="text-sm font-semibold text-amber-800">{t(lang, "catchup_banner_text")}</p>
        </Card>
      </Link>
      <Card>
        <p className="text-sm font-medium text-slate-500">{t(lang, "monthly_target")}</p>
        <p className="text-2xl font-bold text-slate-900">
          {formatCurrency(lang, target?.monthlyTarget as unknown as number)}
        </p>
      </Card>
      <Card>
        <p className="text-sm font-medium text-slate-500">{t(lang, "today_target")}</p>
        <p className="text-2xl font-bold text-slate-900">
          {formatCurrency(lang, target?.todayTarget as unknown as number)}
        </p>
      </Card>
      <Card>
        <p className="text-sm font-medium text-slate-500">{t(lang, "per_retailer_target")}</p>
        <p className="text-2xl font-bold text-slate-900">
          {formatCurrency(lang, target?.perRetailerTarget as unknown as number)}
        </p>
      </Card>

      {incentiveItems.length > 0 && (
        <Card className="overflow-x-auto">
          <h2 className="mb-3 text-base font-bold text-slate-900">{t(lang, "current_incentives")}</h2>
          <table className="w-full min-w-[260px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">{t(lang, "item")}</th>
                <th className="py-2 pr-4">{t(lang, "incentive")}</th>
              </tr>
            </thead>
            <tbody>
              {incentiveItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-900">{item.itemName}</td>
                  <td className="py-2 pr-4 font-semibold text-green-700">
                    ₹{Number(item.incentiveAmount).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card>
        <AttendanceButtons
          lang={lang}
          currentStatus={attendance?.status ?? null}
          currentRouteId={attendance?.routeId}
          routes={assignments.map((a) => ({ id: a.route.id, name: a.route.name }))}
        />
      </Card>

      <h1 className="text-xl font-bold text-slate-900">{t(lang, "my_routes")}</h1>
      {assignments.map(({ route }) => (
        <Link key={route.id} href={`/salesman/routes/${route.id}`}>
          <Card className="flex items-center justify-between hover:bg-slate-50">
            <div>
              <p className="font-semibold text-slate-900">{route.name}</p>
              {route.description && <p className="text-sm text-slate-500">{route.description}</p>}
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
              {usageByRoute.get(route.id)?.size ?? 0}
              {t(lang, "times_this_month")}
            </span>
          </Card>
        </Link>
      ))}
      {assignments.length === 0 && (
        <Card>
          <p className="text-center text-slate-400">{t(lang, "no_routes_assigned")}</p>
        </Card>
      )}
    </div>
  );
}
