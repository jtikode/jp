import { db } from "@/lib/db";
import { StoreCard } from "@/components/telecaller/StoreCard";

export default async function TelecallerDashboardPage() {
  const [stores, outstandingGroups] = await Promise.all([
    db.store.findMany(),
    db.ledgerEntry.groupBy({ by: ["storeId"], _sum: { outstandingAmount: true } }),
  ]);

  const outstandingByStore = new Map(
    outstandingGroups.map((g) => [g.storeId, Number(g._sum.outstandingAmount ?? 0)]),
  );

  const sortedStores = [...stores].sort(
    (a, b) => (outstandingByStore.get(b.id) ?? 0) - (outstandingByStore.get(a.id) ?? 0),
  );

  return (
    <div className="mx-auto max-w-md space-y-3">
      <h1 className="text-xl font-bold text-slate-900">Today&apos;s Store List</h1>
      <p className="text-sm text-slate-500">Sorted by outstanding balance, highest first.</p>
      {sortedStores.map((store) => {
        const outstanding = outstandingByStore.get(store.id);
        return (
          <StoreCard
            key={store.id}
            id={store.id}
            name={store.name}
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
