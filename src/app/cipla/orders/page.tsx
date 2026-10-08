import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCiplaIdentity } from "@/actions/ciplaOtcActions";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { CIPLA_OTC_NOTE_PREFIX } from "@/lib/ciplaOtc";
import { getCiplaBase } from "@/lib/ciplaOtc/base";

export const metadata: Metadata = { title: "Cipla OTC Orders | J P Traders" };

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default async function CiplaOrdersPage() {
  const base = await getCiplaBase();
  const me = await getCiplaIdentity();
  if (!me) redirect(`${base}/login`);

  const db = getOrgScopedDb(me.orgId);
  // A retailer sees their own shop's orders; staff see the latest Cipla OTC
  // orders across all shops (each one names who booked it in its notes).
  const orders = await db.order.findMany({
    where: {
      notes: { startsWith: CIPLA_OTC_NOTE_PREFIX },
      ...(me.kind === "retailer" ? { storeId: me.storeId } : {}),
    },
    include: { items: true, store: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="min-h-dvh bg-slate-100 pb-10">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-slate-900">Cipla OTC orders</h1>
          <a href={`${base}/`} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            Book more
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-3 px-4 pt-4">
        {orders.map((o) => (
          <details key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    Order #{o.orderNumber} · {o.createdAt.toLocaleDateString("en-IN")}
                  </p>
                  {me.kind === "staff" && <p className="truncate text-sm text-slate-600">{o.store.name}</p>}
                  <p className="text-sm text-slate-500">
                    {o.items.length} line{o.items.length === 1 ? "" : "s"} · {inr(Number(o.totalAmount))}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    o.status === "PENDING"
                      ? "bg-amber-100 text-amber-800"
                      : o.status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {o.status === "PENDING" ? "Received" : o.status.charAt(0) + o.status.slice(1).toLowerCase()}
                </span>
              </div>
            </summary>
            <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 text-slate-700">
                    {i.productName.replace(/^CIPLA OTC (FREE )?/, (_m, free) => (free ? "FREE: " : ""))} × {i.quantity}
                    {i.scheme && <span className="block text-xs text-green-700">{i.scheme}</span>}
                  </span>
                  <span className="shrink-0 font-semibold text-slate-900">{inr(Number(i.lineTotal))}</span>
                </li>
              ))}
            </ul>
            {o.notes && <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-500">{o.notes}</pre>}
          </details>
        ))}
        {orders.length === 0 && <p className="py-10 text-center text-slate-500">No Cipla OTC orders yet.</p>}
      </main>
    </div>
  );
}
