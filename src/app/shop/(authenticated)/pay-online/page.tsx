import QRCode from "qrcode";
import { db } from "@/lib/db";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { buildUpiLink, invoiceNote } from "@/lib/upi";
import { Card } from "@/components/ui/Card";
import { PayOnlineSelector, type PayableInvoice } from "@/components/shop/PayOnlineSelector";

export default async function ShopPayOnlinePage() {
  const session = await requireStoreSession();
  const lang = await getLang();

  // Organization isn't tenant-scoped — read directly by id.
  const org = await db.organization.findUniqueOrThrow({ where: { id: session.orgId } });

  if (!org.upiVpa) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <p className="py-6 text-center text-slate-400">{t(lang, "shop_pay_online_not_configured")}</p>
        </Card>
      </div>
    );
  }

  const payeeName = org.upiPayeeName || org.name;

  // Scoped to this retailer's own storeId — never an admin-chosen store.
  const scopedDb = getOrgScopedDb(session.orgId);
  const entries = await scopedDb.ledgerEntry.findMany({
    where: { storeId: session.storeId },
    orderBy: { invoiceDate: "asc" },
  });

  const invoices: PayableInvoice[] = entries
    .filter((e) => Number(e.outstandingAmount) > 0)
    .map((e) => ({
      id: e.id,
      invoiceNo: e.invoiceNo,
      dateLabel: e.invoiceDate
        ? e.invoiceDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
        : null,
      amount: Number(e.amount),
      outstanding: Number(e.outstandingAmount),
    }));

  // Everything is selected by default, so the first paint is the full
  // outstanding amount — the client component regenerates the QR as the
  // retailer unticks bills.
  const defaultTotal = Math.round(invoices.reduce((sum, i) => sum + i.outstanding, 0) * 100) / 100;
  const initialQrDataUrl = await QRCode.toDataURL(
    buildUpiLink({
      vpa: org.upiVpa,
      payeeName,
      amount: defaultTotal,
      note: invoiceNote(invoices.map((i) => i.invoiceNo)),
    }),
    { width: 280, margin: 1 },
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_pay_online_heading")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t(lang, "shop_pay_online_subtitle")}</p>
      </Card>

      <PayOnlineSelector
        vpa={org.upiVpa}
        payeeName={payeeName}
        invoices={invoices}
        initialQrDataUrl={initialQrDataUrl}
        lang={lang}
      />
    </div>
  );
}
