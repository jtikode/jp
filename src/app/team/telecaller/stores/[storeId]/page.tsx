import { notFound } from "next/navigation";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { TelecallerLogForm } from "@/components/forms/TelecallerLogForm";
import { StoreContactForm } from "@/components/telecaller/StoreContactForm";
import {
  buildTelLink,
  buildWhatsAppLink,
  buildRegularItemsMessage,
  buildStatementMessage,
} from "@/lib/waLink";
import { storeLabel } from "@/lib/storeLabel";

export default async function TelecallerStorePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const session = await getSession();
  const db = getOrgScopedDb(session.orgId as string);
  const { storeId } = await params;
  const store = await db.store.findUnique({ where: { id: storeId } });

  if (!store) notFound();

  // Highest-value items first, so the telecaller can lead the call by asking
  // about what this store buys the most rather than reading an arbitrary list.
  const [regularItems, nearExpiryItems, ledgerEntries] = await Promise.all([
    db.purchaseHistoryItem.groupBy({
      by: ["itemName", "unit"],
      where: { storeId },
      _sum: { quantity: true, totalValue: true },
      orderBy: { _sum: { totalValue: "desc" } },
      take: 20,
    }),
    db.expiryItem.findMany({ orderBy: { expiryDate: "asc" }, take: 15 }),
    db.ledgerEntry.findMany({ where: { storeId }, orderBy: { invoiceDate: "asc" } }),
  ]);

  const whatsAppMessage =
    regularItems.length > 0
      ? buildRegularItemsMessage(regularItems.slice(0, 10).map((i) => i.itemName))
      : undefined;

  const totalOutstanding = ledgerEntries.reduce((sum, e) => sum + Number(e.outstandingAmount), 0);
  const statementMessage = buildStatementMessage(
    storeLabel(store.name, store.externalCode),
    ledgerEntries.map((e) => ({
      invoiceNo: e.invoiceNo,
      invoiceDate: e.invoiceDate,
      amount: Number(e.amount),
      outstandingAmount: Number(e.outstandingAmount),
    })),
  );

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <p className="font-semibold text-slate-900">{storeLabel(store.name, store.externalCode)}</p>
        <p className="text-sm text-slate-500">{store.address}</p>
        {store.contactPersonName && (
          <p className="mt-1 text-sm text-slate-600">
            Contact: <span className="font-medium">{store.contactPersonName}</span>
          </p>
        )}
        {store.phone && (
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={buildTelLink(store.phone)}
              className="min-h-11 flex-1 rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800"
            >
              Call
            </a>
            <a
              href={buildWhatsAppLink(store.phone, whatsAppMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-11 flex-1 rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-green-700"
            >
              WhatsApp
            </a>
          </div>
        )}
        {!store.phone && (
          <p className="mt-3 text-sm font-semibold text-amber-700">No mobile number on file yet.</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-bold text-slate-900">Contact Details</h2>
        <p className="mb-3 text-xs text-slate-500">
          {store.phone ? "Fix the number or contact person if it's wrong." : "Add a mobile number for this store."}
        </p>
        <StoreContactForm
          storeId={store.id}
          phone={store.phone}
          contactPersonName={store.contactPersonName}
        />
      </Card>

      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Outstanding Statement</h2>
          <span className="font-bold text-red-700">₹{totalOutstanding.toLocaleString("en-IN")}</span>
        </div>
        {ledgerEntries.length > 0 ? (
          <>
            <div className="mb-3 overflow-x-auto">
              <table className="w-full min-w-[280px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-1.5 pr-3">Invoice</th>
                    <th className="py-1.5 pr-3">Date</th>
                    <th className="py-1.5 pr-3">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.map((e) => (
                    <tr key={e.id} className="border-b border-slate-100">
                      <td className="py-1.5 pr-3 font-medium text-slate-900">{e.invoiceNo ?? "—"}</td>
                      <td className="py-1.5 pr-3 text-slate-600">
                        {e.invoiceDate ? e.invoiceDate.toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="py-1.5 pr-3 font-semibold text-red-700">
                        ₹{Number(e.outstandingAmount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {store.phone ? (
              <a
                href={buildWhatsAppLink(store.phone, statementMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="block min-h-11 rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-green-700"
              >
                Share Statement on WhatsApp
              </a>
            ) : (
              <p className="text-xs text-slate-500">Add a mobile number above to share this on WhatsApp.</p>
            )}
          </>
        ) : (
          <p className="py-2 text-center text-slate-400">No outstanding invoices for this store.</p>
        )}
      </Card>

      {nearExpiryItems.length > 0 && (
        <Card className="overflow-x-auto">
          <h2 className="mb-1 text-base font-bold text-slate-900">Near-Expiry Stock</h2>
          <p className="mb-3 text-xs text-slate-500">Mention these at special rate.</p>
          <table className="w-full min-w-[320px] text-left text-sm">
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
