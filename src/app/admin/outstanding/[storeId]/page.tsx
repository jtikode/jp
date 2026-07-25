import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";

export default async function StoreOutstandingPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const store = await db.store.findUnique({ where: { id: storeId }, include: { route: true } });
  if (!store) notFound();

  const entries = await db.ledgerEntry.findMany({
    where: { storeId },
    orderBy: { invoiceDate: "asc" },
  });

  const totalOutstanding = entries.reduce((sum, e) => sum + Number(e.outstandingAmount), 0);
  const totalBilled = entries.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <h1 className="text-lg font-bold text-slate-900">{store.name}</h1>
        <p className="text-sm text-slate-500">{store.address}</p>
        {store.route && <p className="mt-1 text-xs font-medium text-blue-700">{store.route.name}</p>}
        <div className="mt-4 flex gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Outstanding</p>
            <p className="text-xl font-bold text-red-700">
              ₹{totalOutstanding.toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Billed</p>
            <p className="text-xl font-bold text-slate-900">₹{totalBilled.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Invoices</h2>
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Invoice #</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Bill Amount</th>
              <th className="py-2 pr-4">Balance Due</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{e.invoiceNo ?? "—"}</td>
                <td className="py-2 pr-4 text-slate-600">
                  {e.invoiceDate ? e.invoiceDate.toLocaleDateString() : "—"}
                </td>
                <td className="py-2 pr-4 text-slate-600">
                  ₹{Number(e.amount).toLocaleString("en-IN")}
                </td>
                <td className="py-2 pr-4 font-semibold text-red-700">
                  ₹{Number(e.outstandingAmount).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  No outstanding invoices for this store.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
