import Image from "next/image";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";

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
  const upiLink = `upi://pay?pa=${encodeURIComponent(org.upiVpa)}&pn=${encodeURIComponent(payeeName)}&cu=INR`;
  const qrDataUrl = await QRCode.toDataURL(upiLink, { width: 280, margin: 1 });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_pay_online_heading")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t(lang, "shop_pay_online_subtitle")}</p>
      </Card>

      <Card className="flex flex-col items-center gap-4 text-center">
        <Image src={qrDataUrl} alt="UPI QR code" width={220} height={220} unoptimized />
        <p className="text-sm text-slate-500">{payeeName}</p>
        <a
          href={upiLink}
          className="w-full rounded-lg bg-blue-700 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-blue-800"
        >
          {t(lang, "shop_pay_now")}
        </a>
      </Card>
    </div>
  );
}
