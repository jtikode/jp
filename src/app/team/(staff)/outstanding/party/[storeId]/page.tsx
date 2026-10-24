import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { storeLabel } from "@/lib/storeLabel";
import { SendStatementButton } from "@/components/team/SendStatementButton";

export const dynamic = "force-dynamic";

function daysSince(d: Date): number {
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

function isPast(d: Date): boolean {
  return d.getTime() < Date.now();
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

// Bill-wise outstanding for one party. Any salesman can look up any party's
// dues, not only those on their own routes.
export default async function PartyBillsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const session = await getSession();
  const db = getOrgScopedDb(session.orgId as string);

  const [store, entries] = await Promise.all([
    db.store.findUnique({
      where: { id: storeId },
      select: { name: true, phone: true, externalCode: true, address: true, route: { select: { id: true, name: true } } },
    }),
    db.ledgerEntry.findMany({
      where: { storeId, NOT: { outstandingAmount: 0 } },
      orderBy: { invoiceDate: "asc" },
    }),
  ]);
  if (!store) notFound();

  const total = entries.reduce((sum, e) => sum + Number(e.outstandingAmount), 0);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link
        href={store.route ? `/team/outstanding/${store.route.id}` : "/team/outstanding"}
        className="inline-block text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        ← {store.route ? store.route.name : "Outstanding"}
      </Link>

      <Card>
        <h1 className="text-xl font-bold text-slate-900">{storeLabel(store.name, store.externalCode)}</h1>
        {store.address && <p className="text-sm text-slate-500">{store.address}</p>}
        <p className="mt-2 text-2xl font-extrabold text-red-700">₹{Math.round(total).toLocaleString("en-IN")}</p>
        <p className="text-xs text-slate-500">
          {entries.length} {entries.length === 1 ? "entry" : "entries"} (bills and credits)
        </p>
        <div className="mt-3 space-y-2">
          <SendStatementButton
            phone={store.phone}
            entries={entries.map((e) => ({
              invoiceNo: e.invoiceNo,
              invoiceDate: e.invoiceDate,
              amount: Number(e.amount),
              outstandingAmount: Number(e.outstandingAmount),
            }))}
          />
          {session.role === "SALESMAN" && (
            <Link
              href={`/team/salesman/stores/${storeId}/visit`}
              className="block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
            >
              Log a visit
            </Link>
          )}
          {session.role === "TELECALLER" && (
            <Link
              href={`/team/telecaller/stores/${storeId}`}
              className="block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
            >
              Open store
            </Link>
          )}
        </div>
      </Card>

      <div className="space-y-2">
        {entries.map((e) => {
          const isCredit = Number(e.outstandingAmount) < 0;
          const overdue = !isCredit && e.dueDate != null && isPast(e.dueDate);
          const partlyPaid = Number(e.outstandingAmount) < Number(e.amount);
          return (
            <Card key={e.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{e.invoiceNo ? `${isCredit ? "Credit" : "Bill"} ${e.invoiceNo}` : isCredit ? "Credit / advance" : "Bill (no number)"}</p>
                  <p className="text-xs text-slate-500">
                    {e.invoiceDate ? `${formatDate(e.invoiceDate)} · ${daysSince(e.invoiceDate)} days old` : "No bill date"}
                  </p>
                  {e.dueDate && (
                    <p className={`text-xs ${overdue ? "font-semibold text-red-700" : "text-slate-500"}`}>
                      Due {formatDate(e.dueDate)}
                      {overdue ? " · overdue" : ""}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-lg font-bold ${isCredit ? "text-green-700" : "text-red-700"}`}>
                    {isCredit ? "−" : ""}₹{Math.abs(Math.round(Number(e.outstandingAmount))).toLocaleString("en-IN")}
                  </p>
                  {partlyPaid && !isCredit && (
                    <p className="text-xs text-slate-500">of ₹{Math.round(Number(e.amount)).toLocaleString("en-IN")}</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {entries.length === 0 && <p className="py-6 text-center text-slate-400">No outstanding bills for this party.</p>}
      </div>
    </div>
  );
}
