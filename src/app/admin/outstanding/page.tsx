import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { storeLabel } from "@/lib/storeLabel";

export default async function OutstandingPage() {
  const grouped = await db.ledgerEntry.groupBy({
    by: ["storeId"],
    _sum: { outstandingAmount: true },
    _count: { _all: true },
    orderBy: { _sum: { outstandingAmount: "desc" } },
  });

  const stores = await db.store.findMany({
    where: { id: { in: grouped.map((g) => g.storeId) } },
    include: { route: true },
  });
  const storeMap = new Map(stores.map((s) => [s.id, s]));

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="overflow-x-auto">
        <h1 className="mb-4 text-lg font-bold text-slate-900">Live Outstanding</h1>
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Store</th>
              <th className="py-2 pr-4">Route</th>
              <th className="py-2 pr-4">Invoices</th>
              <th className="py-2 pr-4">Total Outstanding</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((g) => {
              const store = storeMap.get(g.storeId);
              if (!store) return null;
              return (
                <tr key={g.storeId} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-900">
                    {storeLabel(store.name, store.externalCode)}
                  </td>
                  <td className="py-2 pr-4 text-slate-600">{store.route?.name ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-600">{g._count._all}</td>
                  <td className="py-2 pr-4 font-semibold text-red-700">
                    ₹{Number(g._sum.outstandingAmount ?? 0).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2 pr-4">
                    <Link
                      href={`/admin/outstanding/${store.id}`}
                      className="text-sm font-semibold text-blue-700 hover:underline"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              );
            })}
            {grouped.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  No outstanding data uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
