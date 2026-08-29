import { startOfDay, endOfDay } from "date-fns";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StoreCard } from "@/components/telecaller/StoreCard";

const DAILY_CALL_GOAL = 30;

export default async function TelecallerDashboardPage() {
  const session = await getSession();
  const userId = session.userId as string;
  const db = getOrgScopedDb(session.orgId as string);
  const today = new Date();

  const [partyCount, outstandingGroups, todayCallCount] = await Promise.all([
    db.telecallerParty.count(),
    db.ledgerEntry.groupBy({ by: ["storeId"], _sum: { outstandingAmount: true } }),
    db.telecallerLog.count({
      where: { userId, contactDate: { gte: startOfDay(today), lte: endOfDay(today) } },
    }),
  ]);

  // Until admin uploads a party list, keep showing every store so the
  // dashboard never regresses to empty on its own.
  const stores =
    partyCount > 0
      ? (await db.telecallerParty.findMany({ include: { store: true } })).map((p) => p.store)
      : await db.store.findMany();

  const outstandingByStore = new Map(
    outstandingGroups.map((g) => [g.storeId, Number(g._sum.outstandingAmount ?? 0)]),
  );

  const sortedStores = [...stores].sort(
    (a, b) => (outstandingByStore.get(b.id) ?? 0) - (outstandingByStore.get(a.id) ?? 0),
  );

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

      <h1 className="text-xl font-bold text-slate-900">Today&apos;s Store List</h1>
      <p className="text-sm text-slate-500">Sorted by outstanding balance, highest first.</p>
      {sortedStores.map((store) => {
        const outstanding = outstandingByStore.get(store.id);
        return (
          <StoreCard
            key={store.id}
            id={store.id}
            name={store.name}
            externalCode={store.externalCode}
            address={store.address}
            phone={store.phone}
            outstanding={outstanding}
          />
        );
      })}
      {sortedStores.length === 0 && <p className="py-6 text-center text-slate-400">No stores yet.</p>}
    </div>
  );
}
