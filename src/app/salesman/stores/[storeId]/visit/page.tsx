import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { VisitForm } from "@/components/forms/VisitForm";
import { storeLabel } from "@/lib/storeLabel";

export default async function StoreVisitPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await db.store.findUnique({ where: { id: storeId } });

  if (!store) notFound();

  // Highest-value items first, so the salesman can open the visit already
  // knowing what this store usually orders before logging today's numbers.
  const [regularItems, lastTelecallerLog, nearExpiryItems] = await Promise.all([
    db.purchaseHistoryItem.groupBy({
      by: ["itemName", "unit"],
      where: { storeId },
      _sum: { quantity: true, totalValue: true },
      orderBy: { _sum: { totalValue: "desc" } },
      take: 20,
    }),
    db.telecallerLog.findFirst({
      where: { storeId },
      orderBy: { contactDate: "desc" },
    }),
    db.expiryItem.findMany({ orderBy: { expiryDate: "asc" }, take: 15 }),
  ]);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <p className="font-semibold text-slate-900">{storeLabel(store.name, store.externalCode)}</p>
        <p className="text-sm text-slate-500">{store.address}</p>
      </Card>

      {lastTelecallerLog && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <p className="text-xs font-semibold text-amber-800">
            Last telecaller call: {lastTelecallerLog.contactDate.toLocaleDateString("en-IN")}
          </p>
          {lastTelecallerLog.paymentPromise && (
            <p className="mt-1 text-sm font-medium text-amber-900">
              Note: {lastTelecallerLog.paymentPromise}
            </p>
          )}
        </Card>
      )}

      {nearExpiryItems.length > 0 && (
        <Card className="overflow-x-auto">
          <h2 className="mb-1 text-base font-bold text-slate-900">Near-Expiry Stock</h2>
          <p className="mb-3 text-xs text-slate-500">Push these at special rate.</p>
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Expiry</th>
                <th className="py-2 pr-4">Rate</th>
              </tr>
            </thead>
            <tbody>
              {nearExpiryItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-900">{item.itemName}</td>
                  <td className="py-2 pr-4 text-slate-600">
                    {item.expiryDate.toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-2 pr-4 text-slate-600">
                    {item.specialRate != null ? `₹${Number(item.specialRate).toLocaleString("en-IN")}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {regularItems.length > 0 && (
        <Card className="overflow-x-auto">
          <h2 className="mb-1 text-base font-bold text-slate-900">Regularly bought items</h2>
          <p className="mb-3 text-xs text-slate-500">Highest value first — check before you order.</p>
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Qty</th>
              </tr>
            </thead>
            <tbody>
              {regularItems.map((item) => (
                <tr key={`${item.itemName}-${item.unit}`} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-900">{item.itemName}</td>
                  <td className="py-2 pr-4 text-slate-600">
                    {Number(item._sum.quantity ?? 0).toLocaleString("en-IN")} {item.unit ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <VisitForm storeId={store.id} />
    </div>
  );
}
