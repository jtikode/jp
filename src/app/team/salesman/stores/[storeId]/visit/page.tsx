import { notFound } from "next/navigation";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { VisitForm } from "@/components/forms/VisitForm";
import { storeLabel } from "@/lib/storeLabel";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";

export default async function StoreVisitPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const session = await getSession();
  const db = getOrgScopedDb(session.orgId as string);
  const { storeId } = await params;
  const store = await db.store.findUnique({ where: { id: storeId } });

  if (!store) notFound();
  const lang = await getLang();

  // Highest-value items first, so the salesman can open the visit already
  // knowing what this store usually orders before logging today's numbers.
  const [regularItems, lastTelecallerLog, nearExpiryItems, ledgerEntries] = await Promise.all([
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
    db.ledgerEntry.findMany({ where: { storeId }, select: { outstandingAmount: true } }),
  ]);
  const totalOutstanding = ledgerEntries.reduce((sum, e) => sum + Number(e.outstandingAmount), 0);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <p className="font-semibold text-slate-900">{storeLabel(store.name, store.externalCode)}</p>
        <p className="text-sm text-slate-500">{store.address}</p>
        {ledgerEntries.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-xs font-medium text-slate-500">{t(lang, "total_outstanding")}</p>
            <p className="text-lg font-bold text-red-700">
              ₹{totalOutstanding.toLocaleString("en-IN")}
            </p>
          </div>
        )}
      </Card>

      {lastTelecallerLog && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <p className="text-xs font-semibold text-amber-800">
            {t(lang, "last_telecaller_call")} {lastTelecallerLog.contactDate.toLocaleDateString("en-IN")}
          </p>
          {lastTelecallerLog.paymentPromise && (
            <p className="mt-1 text-sm font-medium text-amber-900">
              {t(lang, "note")} {lastTelecallerLog.paymentPromise}
            </p>
          )}
        </Card>
      )}

      {nearExpiryItems.length > 0 && (
        <Card className="overflow-x-auto">
          <h2 className="mb-1 text-base font-bold text-slate-900">{t(lang, "near_expiry_stock")}</h2>
          <p className="mb-3 text-xs text-slate-500">{t(lang, "push_special_rate")}</p>
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">{t(lang, "item")}</th>
                <th className="py-2 pr-4">{t(lang, "expiry")}</th>
                <th className="py-2 pr-4">{t(lang, "rate")}</th>
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
          <h2 className="mb-1 text-base font-bold text-slate-900">{t(lang, "regularly_bought_items")}</h2>
          <p className="mb-3 text-xs text-slate-500">{t(lang, "check_before_order")}</p>
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">{t(lang, "item")}</th>
                <th className="py-2 pr-4">{t(lang, "qty")}</th>
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

      <VisitForm storeId={store.id} lang={lang} />
    </div>
  );
}
