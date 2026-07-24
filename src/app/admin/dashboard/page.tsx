import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { FilterBar } from "@/components/admin/FilterBar";
import { RecordsTable } from "@/components/admin/RecordsTable";
import { getUnifiedRecords } from "@/lib/adminRecords";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  const [routes, employees, records] = await Promise.all([
    db.route.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    getUnifiedRecords(params),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card>
        <FilterBar
          routes={routes.map((r) => ({ id: r.id, label: r.name }))}
          employees={employees.map((e) => ({ id: e.id, label: `${e.name} (${e.role})` }))}
          values={params}
        />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          All Activity ({records.length} record{records.length === 1 ? "" : "s"})
        </h2>
        <RecordsTable records={records} />
      </Card>
    </div>
  );
}
