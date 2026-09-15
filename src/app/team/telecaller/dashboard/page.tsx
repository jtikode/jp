import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { getStartOfIstDayUtc, getEndOfIstDayUtc } from "@/lib/istTime";
import { getTelecallerStores } from "@/lib/telecallerStores";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

const DAILY_CALL_GOAL = 30;

export default async function TelecallerDashboardPage() {
  const session = await getSession();
  const userId = session.userId as string;
  const orgId = session.orgId as string;
  const db = getOrgScopedDb(orgId);
  const today = new Date();

  const stores = await getTelecallerStores(orgId, userId);
  const storeIds = stores.map((s) => s.id);

  const [todayCallCount, outstandingGroups] = await Promise.all([
    db.telecallerLog.count({
      where: { userId, contactDate: { gte: getStartOfIstDayUtc(today), lte: getEndOfIstDayUtc(today) } },
    }),
    db.ledgerEntry.groupBy({
      by: ["storeId"],
      where: { storeId: { in: storeIds } },
      _sum: { outstandingAmount: true },
    }),
  ]);

  const storesWithDues = outstandingGroups.filter((g) => Number(g._sum.outstandingAmount ?? 0) > 0).length;

  return (
    <div className="mx-auto max-w-md space-y-3">
      <Card>
        <ProgressBar
          label="Today's calls"
          achieved={todayCallCount}
          target={DAILY_CALL_GOAL}
          formatValue={(v) => `${v}`}
        />
      </Card>

      <Link
        href="/team/telecaller/orders"
        className="block rounded-xl border-2 border-blue-200 bg-blue-50 p-4 hover:border-blue-400"
      >
        <p className="text-lg font-bold text-blue-900">📋 Order Call List</p>
        <p className="text-sm text-blue-700">{stores.length} stores to call about ordering</p>
      </Link>

      <Link
        href="/team/telecaller/payments"
        className="block rounded-xl border-2 border-red-200 bg-red-50 p-4 hover:border-red-400"
      >
        <p className="text-lg font-bold text-red-900">💰 Payment Call List</p>
        <p className="text-sm text-red-700">{storesWithDues} stores with outstanding dues</p>
      </Link>
    </div>
  );
}
