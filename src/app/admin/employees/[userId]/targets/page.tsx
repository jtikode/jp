import { notFound } from "next/navigation";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { TargetForm } from "@/components/admin/TargetForm";

export default async function EmployeeTargetsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);
  const { userId } = await params;
  const employee = await db.user.findUnique({ where: { id: userId } });
  if (!employee) notFound();

  const today = new Date();
  const periodMonth = today.getMonth() + 1;
  const periodYear = today.getFullYear();

  const target = await db.target.findUnique({
    where: { userId_periodMonth_periodYear: { userId, periodMonth, periodYear } },
  });

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <h1 className="mb-1 text-lg font-bold text-slate-900">{employee.name}</h1>
        <p className="mb-4 text-sm text-slate-500">
          Targets for {today.toLocaleString("default", { month: "long" })} {periodYear}
        </p>
        <TargetForm
          userId={userId}
          periodMonth={periodMonth}
          periodYear={periodYear}
          defaults={{
            monthlyTarget: Number(target?.monthlyTarget ?? 0),
            todayTarget: Number(target?.todayTarget ?? 0),
            perRetailerTarget: Number(target?.perRetailerTarget ?? 0),
          }}
        />
      </Card>
    </div>
  );
}
