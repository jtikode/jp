import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { RequestProductForm } from "@/components/shop/RequestProductForm";

export default async function ShopRequestProductPage() {
  const lang = await getLang();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_request_product_heading")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t(lang, "shop_request_product_subtitle")}</p>
      </Card>

      <Card>
        <RequestProductForm lang={lang} />
      </Card>
    </div>
  );
}
