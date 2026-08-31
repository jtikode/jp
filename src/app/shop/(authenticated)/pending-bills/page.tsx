import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";

export default async function ShopPendingBillsPage() {
  const session = await requireStoreSession();
  const db = getOrgScopedDb(session.orgId);
  const lang = await getLang();

  // Scoped to this retailer's own storeId — never an admin-chosen store.
  const entries = await db.ledgerEntry.findMany({
    where: { storeId: session.storeId },
    orderBy: { invoiceDate: "asc" },
  });

  const totalOutstanding = entries.reduce((sum, e) => sum + Number(e.outstandingAmount), 0);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_pending_bills_heading")}</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">{t(lang, "shop_total_outstanding")}</p>
        <p className="text-2xl font-bold text-red-700">₹{totalOutstanding.toLocaleString("en-IN")}</p>
        <p className="mt-2 text-xs font-medium text-amber-700">{t(lang, "shop_outstanding_weekly_note")}</p>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">{t(lang, "shop_invoice_no")}</th>
              <th className="py-2 pr-4">{t(lang, "shop_date")}</th>
              <th className="py-2 pr-4">{t(lang, "shop_bill_amount")}</th>
              <th className="py-2 pr-4">{t(lang, "shop_balance_due")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{e.invoiceNo ?? "—"}</td>
                <td className="py-2 pr-4 text-slate-600">
                  {e.invoiceDate ? e.invoiceDate.toLocaleDateString("en-IN") : "—"}
                </td>
                <td className="py-2 pr-4 text-slate-600">₹{Number(e.amount).toLocaleString("en-IN")}</td>
                <td className="py-2 pr-4 font-semibold text-red-700">
                  ₹{Number(e.outstandingAmount).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  {t(lang, "shop_no_pending_bills")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
