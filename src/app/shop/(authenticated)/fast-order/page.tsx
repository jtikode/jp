import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { FastOrderList } from "@/components/shop/FastOrderList";
import { getFastOrderItems } from "@/actions/orderActions";

export default async function ShopFastOrderPage() {
  await requireStoreSession();
  const lang = await getLang();
  const items = await getFastOrderItems();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_fast_order_heading")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t(lang, "shop_fast_order_subtitle")}</p>
      </Card>

      <FastOrderList items={items} lang={lang} />
    </div>
  );
}
