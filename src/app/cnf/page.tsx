import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { getCnfIdentity } from "@/actions/cnfActions";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { loadCnfCatalog } from "@/lib/cnf/catalog";
import { CNF_GROUPS } from "@/lib/cnf/config";
import { getCnfBase } from "@/lib/cnf/base";
import { inr } from "@/lib/cnf/format";
import { CnfSignOut } from "@/components/cnf/CnfSignOut";

export const metadata: Metadata = {
  title: "Distributor Orders | J P Traders",
  description: "Order DKT, Morepen, Ambitech, Cipla OTC and Omee directly from J P Traders.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const SHOWN_BILLS = 5;

const TILE_COLORS: Record<string, string> = {
  dkt: "bg-rose-100 text-rose-700",
  "morepen-devices": "bg-sky-100 text-sky-700",
  "morepen-burnol": "bg-orange-100 text-orange-700",
  ambitech: "bg-emerald-100 text-emerald-700",
  "cipla-otc": "bg-violet-100 text-violet-700",
  omee: "bg-amber-100 text-amber-700",
};

export default async function CnfHomePage() {
  const base = await getCnfBase();
  const me = await getCnfIdentity();
  if (!me) redirect(`${base}/login`);

  const db = getOrgScopedDb(me.orgId);
  const [products, bills] = await Promise.all([
    loadCnfCatalog(me.orgId, me.percent),
    // Scoped to this distributor's own store, same as the shop's pending bills.
    db.ledgerEntry.findMany({ where: { storeId: me.storeId }, orderBy: { invoiceDate: "asc" } }),
  ]);

  const totalDue = bills.reduce((sum, b) => sum + Number(b.outstandingAmount), 0);
  const today = new Date();

  return (
    <div className="min-h-dvh bg-slate-100 pb-10">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900">Distributor Orders</h1>
            <p className="truncate text-xs text-slate-500">{me.name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={`${base}/orders`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
              My orders
            </Link>
            <CnfSignOut base={base} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 pt-4">
        <form action={`${base}/products`} method="get" role="search" className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            type="search"
            placeholder="Search products"
            aria-label="Search products"
            className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white pl-9 pr-3 text-base focus:border-blue-600 focus:outline-none"
          />
        </form>

        <Image
          src="/banners/cnf-banner.jpg"
          alt="Order direct from J P Traders at distributor rates"
          width={1200}
          height={400}
          priority
          className="w-full rounded-2xl"
        />

        <section aria-label="Companies">
          <h2 className="mb-2 text-sm font-semibold text-slate-500">Shop by company</h2>
          <div className="grid grid-cols-2 gap-3">
            {CNF_GROUPS.map((g) => (
              <Link
                key={g.slug}
                href={`${base}/products?group=${g.slug}`}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold ${TILE_COLORS[g.slug] ?? "bg-slate-100 text-slate-700"}`}>
                  {g.label.charAt(0)}
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">{g.label}</span>
                  <span className="block text-xs text-slate-500">{products.filter((p) => p.group === g.slug).length} products</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-label="Pending bills" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-500">Pending bills</h2>
              <p className={`text-2xl font-bold ${totalDue > 0 ? "text-red-700" : "text-green-700"}`}>{inr(totalDue)}</p>
            </div>
            {bills.length > SHOWN_BILLS && (
              <Link href={`${base}/bills`} className="shrink-0 text-sm font-semibold text-blue-700">
                View all {bills.length}
              </Link>
            )}
          </div>
          {bills.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No pending bills.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
              {bills.slice(0, SHOWN_BILLS).map((b) => {
                const overdue = b.dueDate != null && b.dueDate < today;
                return (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">Bill {b.invoiceNo ?? "—"}</p>
                      <p className="text-xs text-slate-500">
                        {b.invoiceDate ? b.invoiceDate.toLocaleDateString("en-IN") : "—"} · Bill amount {inr(Number(b.amount))}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-red-700">{inr(Number(b.outstandingAmount))}</p>
                      {overdue && <p className="text-xs font-medium text-amber-700">Overdue</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
