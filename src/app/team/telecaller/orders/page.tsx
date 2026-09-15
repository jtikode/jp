import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { getTelecallerStores } from "@/lib/telecallerStores";
import { Card } from "@/components/ui/Card";
import { StoreCard } from "@/components/telecaller/StoreCard";

export default async function TelecallerOrdersPage() {
  const session = await getSession();
  const userId = session.userId as string;
  const orgId = session.orgId as string;
  const db = getOrgScopedDb(orgId);

  const stores = await getTelecallerStores(orgId, userId);
  const storeIds = stores.map((s) => s.id);

  const lastCalls = await db.telecallerLog.groupBy({
    by: ["storeId"],
    where: { storeId: { in: storeIds } },
    _max: { contactDate: true },
  });
  const lastCallByStore = new Map(lastCalls.map((c) => [c.storeId, c._max.contactDate]));

  // Never-called stores first, then longest-since-called, so the list
  // itself tells a telecaller who to ring next.
  const sortedStores = [...stores].sort((a, b) => {
    const aLast = lastCallByStore.get(a.id)?.getTime() ?? 0;
    const bLast = lastCallByStore.get(b.id)?.getTime() ?? 0;
    return aLast - bLast;
  });

  return (
    <div className="mx-auto max-w-md space-y-3">
      <Link
        href="/team/telecaller/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        ← Dashboard
      </Link>

      <Card>
        <h1 className="text-lg font-bold text-slate-900">Order Call List</h1>
        <p className="text-sm text-slate-500">Never-called and longest-overdue stores first.</p>
      </Card>

      {sortedStores.map((store) => {
        const lastCall = lastCallByStore.get(store.id);
        return (
          <div key={store.id}>
            {lastCall && (
              <p className="mb-1 text-xs text-slate-400">
                Last called {lastCall.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </p>
            )}
            <StoreCard
              id={store.id}
              name={store.name}
              externalCode={store.externalCode}
              address={store.address}
              phone={store.phone}
            />
          </div>
        );
      })}
      {sortedStores.length === 0 && <p className="py-6 text-center text-slate-400">No stores yet.</p>}
    </div>
  );
}
