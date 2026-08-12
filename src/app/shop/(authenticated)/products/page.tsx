import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { ProductList } from "@/components/shop/ProductList";

export default async function ShopProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const session = await requireStoreSession();
  const db = getOrgScopedDb(session.orgId);
  const lang = await getLang();
  const { company } = await searchParams;

  const products = await db.product.findMany({
    where: { active: true },
    orderBy: [{ company: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_catalog_heading")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t(lang, "shop_catalog_subtitle")}</p>
      </Card>

      <Card>
        <ProductList
          lang={lang}
          companyFilter={company}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            company: p.company,
            unit: p.unit,
            price: Number(p.price),
            mrp: p.mrp != null ? Number(p.mrp) : null,
            taxPercent: p.taxPercent != null ? Number(p.taxPercent) : null,
            scheme: p.scheme,
            composition: p.composition,
            stock: p.stock,
          }))}
        />
      </Card>
    </div>
  );
}
