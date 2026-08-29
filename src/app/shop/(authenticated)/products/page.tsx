import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { ProductList } from "@/components/shop/ProductList";
import { getHotSellingProductIds } from "@/lib/hotSelling";
import { getActiveCatalog } from "@/lib/productCatalog";
import { getActiveWednesdayDeals, getRemainingDealQtyMap, isWednesdayToday } from "@/lib/wednesdayDeals";

export default async function ShopProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; filter?: string; q?: string }>;
}) {
  const session = await requireStoreSession();
  const lang = await getLang();
  const { company, filter, q } = await searchParams;

  const [catalog, hotIds, deals] = await Promise.all([
    getActiveCatalog(session.orgId),
    getHotSellingProductIds(session.orgId),
    isWednesdayToday() ? getActiveWednesdayDeals(session.orgId) : Promise.resolve([]),
  ]);
  const remainingByDealId = await getRemainingDealQtyMap(session.orgId, session.storeId, deals);
  const dealByProductId = new Map(
    deals
      .filter((d) => (remainingByDealId.get(d.id) ?? 0) > 0)
      .map((d) => [d.productId, { id: d.id, price: d.dealPrice, remainingQty: remainingByDealId.get(d.id)! }]),
  );

  const products = [...catalog].sort(
    (a, b) => (a.company ?? "").localeCompare(b.company ?? "") || a.name.localeCompare(b.name),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_catalog_heading")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t(lang, "shop_catalog_subtitle")}</p>
      </Card>

      <Card>
        <ProductList
          lang={lang}
          initialQuery={q}
          companyFilter={company}
          hotOnly={filter === "hot"}
          products={products.map((p) => ({
            ...p,
            hot: hotIds.has(p.id),
            deal: dealByProductId.get(p.id) ?? null,
          }))}
        />
      </Card>
    </div>
  );
}
