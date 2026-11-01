import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCnfIdentity } from "@/actions/cnfActions";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getCnfBase } from "@/lib/cnf/base";
import { inr } from "@/lib/cnf/format";

export const metadata: Metadata = { title: "Pending Bills | J P Traders", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";


export default async function CnfBillsPage() {
  const base = await getCnfBase();
  const me = await getCnfIdentity();
  if (!me) redirect(`${base}/login`);

  const db = getOrgScopedDb(me.orgId);
  const bills = await db.ledgerEntry.findMany({ where: { storeId: me.storeId }, orderBy: { invoiceDate: "asc" } });
  const totalDue = bills.reduce((sum, b) => sum + Number(b.outstandingAmount), 0);
  const today = new Date();

  return (
    <div className="min-h-dvh bg-slate-100 pb-10">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-slate-900">Pending bills</h1>
          <Link href={`${base}/`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
            Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-3 px-4 pt-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total pending</p>
          <p className={`text-2xl font-bold ${totalDue > 0 ? "text-red-700" : "text-green-700"}`}>{inr(totalDue)}</p>
        </div>
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
          {bills.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">Bill {b.invoiceNo ?? "—"}</p>
                <p className="text-xs text-slate-500">
                  {b.invoiceDate ? b.invoiceDate.toLocaleDateString("en-IN") : "—"} · Bill amount {inr(Number(b.amount))}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold text-red-700">{inr(Number(b.outstandingAmount))}</p>
                {b.dueDate != null && b.dueDate < today && <p className="text-xs font-medium text-amber-700">Overdue</p>}
              </div>
            </li>
          ))}
          {bills.length === 0 && <li className="py-8 text-center text-slate-500">No pending bills.</li>}
        </ul>
      </main>
    </div>
  );
}
