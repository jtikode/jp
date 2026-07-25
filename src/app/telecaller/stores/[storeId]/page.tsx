import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { TelecallerLogForm } from "@/components/forms/TelecallerLogForm";
import { buildTelLink, buildWhatsAppLink } from "@/lib/waLink";

export default async function TelecallerStorePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await db.store.findUnique({ where: { id: storeId } });

  if (!store) notFound();

  // Highest-value items first, so the telecaller can lead the call by asking
  // about what this store buys the most rather than reading an arbitrary list.
  const regularItems = await db.purchaseHistoryItem.groupBy({
    by: ["itemName", "unit"],
    where: { storeId },
    _sum: { quantity: true, totalValue: true },
    orderBy: { _sum: { totalValue: "desc" } },
    take: 20,
  });

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <p className="font-semibold text-slate-900">{store.name}</p>
        <p className="text-sm text-slate-500">{store.address}</p>
        {store.phone && (
          <div className="mt-3 flex gap-2">
            <a
              href={buildTelLink(store.phone)}
              className="min-h-11 flex-1 rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800"
            >
              Call
            </a>
            <a
              href={buildWhatsAppLink(store.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-11 flex-1 rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-green-700"
            >
              WhatsApp
            </a>
          </div>
        )}
      </Card>

      {regularItems.length > 0 && (
        <Card className="overflow-x-auto">
          <h2 className="mb-1 text-base font-bold text-slate-900">Regularly bought items</h2>
          <p className="mb-3 text-xs text-slate-500">Ask about these — highest value first.</p>
          <table className="w-full min-w-[320px] text-left text-sm">
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

      <Card>
        <TelecallerLogForm storeId={store.id} />
      </Card>
    </div>
  );
}
