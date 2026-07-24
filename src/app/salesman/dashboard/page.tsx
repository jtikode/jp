import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "Not set";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export default async function SalesmanDashboardPage() {
  const session = await getSession();
  const today = new Date();

  const target = await db.target.findUnique({
    where: {
      userId_periodMonth_periodYear: {
        userId: session.userId as string,
        periodMonth: today.getMonth() + 1,
        periodYear: today.getFullYear(),
      },
    },
  });

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <p className="text-sm font-medium text-slate-500">Monthly Target</p>
        <p className="text-2xl font-bold text-slate-900">{formatCurrency(target?.monthlyTarget as unknown as number)}</p>
      </Card>
      <Card>
        <p className="text-sm font-medium text-slate-500">Today Target</p>
        <p className="text-2xl font-bold text-slate-900">{formatCurrency(target?.todayTarget as unknown as number)}</p>
      </Card>
      <Card>
        <p className="text-sm font-medium text-slate-500">Per Retailer Target</p>
        <p className="text-2xl font-bold text-slate-900">{formatCurrency(target?.perRetailerTarget as unknown as number)}</p>
      </Card>
    </div>
  );
}
