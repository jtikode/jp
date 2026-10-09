import { Suspense } from "react";
import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import {
  getStartOfIstMonthUtc,
  getEndOfIstMonthUtc,
  getStartOfIstDayUtc,
  getEndOfIstDayUtc,
  getStartOfIstWeekUtc,
  getIstDateParts,
} from "@/lib/istTime";
import { Card } from "@/components/ui/Card";
import { FilterBar } from "@/components/admin/FilterBar";
import { RecordsTable } from "@/components/admin/RecordsTable";
import { SalesmanGlanceTable, type SalesmanGlanceRow } from "@/components/admin/SalesmanGlanceTable";
import { getUnifiedRecords } from "@/lib/adminRecords";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";
import { LoginActivitySections } from "@/components/admin/LoginActivitySections";

const RANGES = [
  { key: "day", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
] as const;

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);
  const params = await searchParams;
  const today = new Date();
  const monthStart = getStartOfIstMonthUtc(today);
  const monthEnd = getEndOfIstMonthUtc(today);
  const { year: istYear, month: istMonth } = getIstDateParts(today);

  const range = RANGES.find((r) => r.key === params.range)?.key ?? "day";
  const rangeStart =
    range === "day" ? getStartOfIstDayUtc(today) : range === "week" ? getStartOfIstWeekUtc(today) : monthStart;

  const [routes, employees, records, salesmen, todayAgg, monthAgg, targets, orderTotals, cancelledCount] = await Promise.all([
    db.route.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    getUnifiedRecords(session.orgId, params),
    db.user.findMany({ where: { role: "SALESMAN", active: true }, orderBy: { name: "asc" } }),
    db.visit.groupBy({
      by: ["userId"],
      where: { visitDate: { gte: getStartOfIstDayUtc(today), lte: getEndOfIstDayUtc(today) } },
      _sum: { orderAmount: true, collectionAmount: true },
    }),
    db.visit.groupBy({
      by: ["userId"],
      where: { visitDate: { gte: monthStart, lte: monthEnd } },
      _sum: { orderAmount: true, collectionAmount: true },
    }),
    db.target.findMany({
      where: { periodMonth: istMonth + 1, periodYear: istYear },
    }),
    // Orders received through the shop app (retailer-placed and staff-booked)
    // in the chosen window; cancelled orders are left out of both figures.
    db.order.aggregate({
      where: { createdAt: { gte: rangeStart }, status: { not: "CANCELLED" } },
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    db.order.count({ where: { createdAt: { gte: rangeStart }, status: "CANCELLED" } }),
  ]);
  const ordersReceived = orderTotals._count._all;
  const ordersValue = Number(orderTotals._sum.totalAmount ?? 0);

  const todayByUser = new Map(todayAgg.map((a) => [a.userId, a._sum]));
  const monthByUser = new Map(monthAgg.map((a) => [a.userId, a._sum]));
  const targetByUser = new Map(targets.map((t) => [t.userId, t]));

  const glanceRows: SalesmanGlanceRow[] = salesmen.map((s) => {
    const target = targetByUser.get(s.id);
    return {
      userId: s.id,
      name: s.name,
      todayOrderAmount: Number(todayByUser.get(s.id)?.orderAmount ?? 0),
      todayCollection: Number(todayByUser.get(s.id)?.collectionAmount ?? 0),
      monthOrderAmount: Number(monthByUser.get(s.id)?.orderAmount ?? 0),
      monthCollection: Number(monthByUser.get(s.id)?.collectionAmount ?? 0),
      todayTarget: Number(target?.todayTarget ?? 0),
      monthlyTarget: Number(target?.monthlyTarget ?? 0),
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Orders Received on the App</h2>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Order period">
            {RANGES.map((r) => (
              <Link
                key={r.key}
                href={`/team/admin/dashboard?range=${r.key}`}
                role="tab"
                aria-selected={range === r.key}
                className={
                  range === r.key
                    ? "rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm"
                    : "rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                }
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs font-medium text-blue-800">Total orders</p>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">{ordersReceived}</p>
          </div>
          <div className="rounded-xl bg-green-50 p-4">
            <p className="text-xs font-medium text-green-800">Total order value</p>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">{inr(ordersValue)}</p>
          </div>
        </div>
        {cancelledCount > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            Excludes {cancelledCount} cancelled order{cancelledCount === 1 ? "" : "s"}.
          </p>
        )}
      </Card>

      <Card className="overflow-x-auto">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Salesmen: At a Glance</h2>
          <ExportExcelButton
            data={glanceRows.map((r) => ({
              Salesman: r.name,
              "Today Order": r.todayOrderAmount,
              "Today Target": r.todayTarget,
              "Today Collected": r.todayCollection,
              "Month Order": r.monthOrderAmount,
              "Month Target": r.monthlyTarget,
              "Month Collected": r.monthCollection,
            }))}
            filename="salesmen-at-a-glance"
          />
        </div>
        <SalesmanGlanceTable rows={glanceRows} />
      </Card>

      <Card>
        <FilterBar
          routes={routes.map((r) => ({ id: r.id, label: r.name }))}
          employees={employees.map((e) => ({ id: e.id, label: `${e.name} (${e.role})` }))}
          values={params}
        />
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            All Activity ({records.length} record{records.length === 1 ? "" : "s"})
          </h2>
          <ExportExcelButton
            data={records.map((r) => ({
              Date: r.date.toLocaleString(),
              Type: r.type,
              Employee: r.employeeName,
              Role: r.role,
              Route: r.routeName ?? "",
              Store: r.storeName ?? "",
              Collection: r.collection ?? "",
              "Order Amount": r.orderAmount ?? "",
              Reason: r.reason ?? "",
            }))}
            filename="all-activity"
          />
        </div>
        <RecordsTable records={records} />
      </Card>

      <Suspense fallback={<Card><p className="text-sm text-slate-500">Loading app adoption and login activity...</p></Card>}>
        <LoginActivitySections orgId={session.orgId} />
      </Suspense>
    </div>
  );
}
