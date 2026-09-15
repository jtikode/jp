import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { getTelecallerStores } from "@/lib/telecallerStores";
import { Card } from "@/components/ui/Card";
import { PaymentCallCard } from "@/components/telecaller/PaymentCallCard";

export default async function TelecallerPaymentsPage() {
  const session = await getSession();
  const userId = session.userId as string;
  const orgId = session.orgId as string;
  const db = getOrgScopedDb(orgId);

  const stores = await getTelecallerStores(orgId, userId);
  const storeIds = stores.map((s) => s.id);

  const ledgerEntries = await db.ledgerEntry.findMany({
    where: { storeId: { in: storeIds } },
    orderBy: { invoiceDate: "asc" },
  });

  const entriesByStore = new Map<string, typeof ledgerEntries>();
  for (const e of ledgerEntries) {
    const list = entriesByStore.get(e.storeId) ?? [];
    list.push(e);
    entriesByStore.set(e.storeId, list);
  }

  const rows = stores
    .map((store) => {
      const entries = entriesByStore.get(store.id) ?? [];
      const outstanding = entries.reduce((sum, e) => sum + Number(e.outstandingAmount), 0);
      return { store, entries, outstanding };
    })
    .filter((r) => r.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);

  return (
    <div className="mx-auto max-w-md space-y-3">
      <Link
        href="/team/telecaller/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        ← Dashboard
      </Link>

      <Card>
        <h1 className="text-lg font-bold text-slate-900">Payment Call List</h1>
        <p className="text-sm text-slate-500">
          Sorted by outstanding balance, highest first. &quot;Send Statement&quot; opens WhatsApp
          with the itemized due amount pre-filled in Marathi.
        </p>
      </Card>

      {rows.map(({ store, entries, outstanding }) => (
        <PaymentCallCard
          key={store.id}
          id={store.id}
          name={store.name}
          externalCode={store.externalCode}
          address={store.address}
          phone={store.phone}
          outstanding={outstanding}
          entries={entries.map((e) => ({
            invoiceNo: e.invoiceNo,
            invoiceDate: e.invoiceDate,
            amount: Number(e.amount),
            outstandingAmount: Number(e.outstandingAmount),
          }))}
        />
      ))}
      {rows.length === 0 && (
        <p className="py-6 text-center text-slate-400">No outstanding dues right now.</p>
      )}
    </div>
  );
}
