import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { QuickCheckList } from "@/components/shop/QuickCheckList";

export default async function ShopQuickCheckPage() {
  const session = await requireStoreSession();
  const db = getOrgScopedDb(session.orgId);
  const lang = await getLang();

  const products = await db.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_quick_check_heading")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t(lang, "shop_quick_check_subtitle")}</p>
      </Card>

      <QuickCheckList
        lang={lang}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          company: p.company,
          unit: p.unit,
          price: Number(p.price),
          mrp: p.mrp != null ? Number(p.mrp) : null,
          composition: p.composition,
          stock: p.stock,
        }))}
      />
    </div>
  );
}
