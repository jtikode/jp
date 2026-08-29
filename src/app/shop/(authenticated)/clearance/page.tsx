import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { normalizeName } from "@/lib/normalizeName";
import { Card } from "@/components/ui/Card";
import { ClearanceList, type ClearanceItem } from "@/components/shop/ClearanceList";

export default async function ShopClearancePage() {
  const session = await requireStoreSession();
  const db = getOrgScopedDb(session.orgId);
  const lang = await getLang();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [expiryItems, products] = await Promise.all([
    db.expiryItem.findMany({
      where: { expiryDate: { gte: today } },
      orderBy: { expiryDate: "asc" },
    }),
    db.product.findMany({ where: { active: true } }),
  ]);

  const productByNormalizedName = new Map(products.map((p) => [normalizeName(p.name), p]));

  const items: ClearanceItem[] = [];
  for (const e of expiryItems) {
    const product = productByNormalizedName.get(normalizeName(e.itemName));
    if (!product) continue;
    if (product.stock === 0) continue;

    const daysLeft = Math.ceil((e.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    items.push({
      expiryItemId: e.id,
      productId: product.id,
      name: product.name,
      company: product.company,
      unit: product.unit,
      normalPrice: Number(product.price),
      specialRate: e.specialRate != null ? Number(e.specialRate) : null,
      stock: product.stock,
      expiryDate: e.expiryDate.toISOString(),
      daysLeft,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_clearance_heading")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t(lang, "shop_clearance_subtitle")}</p>
      </Card>

      <ClearanceList items={items} lang={lang} />
    </div>
  );
}
