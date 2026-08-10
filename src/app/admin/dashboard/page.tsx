import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { FilterBar } from "@/components/admin/FilterBar";
import { RecordsTable } from "@/components/admin/RecordsTable";
import { SalesmanGlanceTable, type SalesmanGlanceRow } from "@/components/admin/SalesmanGlanceTable";
import { getUnifiedRecords } from "@/lib/adminRecords";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);
  const params = await searchParams;
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const [routes, employees, records, salesmen, todayAgg, monthAgg, targets] = await Promise.all([
    db.route.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    getUnifiedRecords(session.orgId, params),
    db.user.findMany({ where: { role: "SALESMAN", active: true }, orderBy: { name: "asc" } }),
    db.visit.groupBy({
      by: ["userId"],
      where: { visitDate: { gte: startOfDay(today), lte: endOfDay(today) } },
      _sum: { orderAmount: true, collectionAmount: true },
    }),
    db.visit.groupBy({
      by: ["userId"],
      where: { visitDate: { gte: monthStart, lte: monthEnd } },
      _sum: { orderAmount: true, collectionAmount: true },
    }),
    db.target.findMany({
      where: { periodMonth: today.getMonth() + 1, periodYear: today.getFullYear() },
    }),
  ]);

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
      <Card className="overflow-x-auto">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Salesmen — At a Glance</h2>
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
    </div>
  );
}
