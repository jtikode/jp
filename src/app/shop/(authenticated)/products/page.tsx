import { requireStoreSession } from "@/lib/retailerPermissions";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { normalizeName } from "@/lib/normalizeName";
import { Card } from "@/components/ui/Card";
import { ProductList } from "@/components/shop/ProductList";
import { getHotSellingProductIds } from "@/lib/hotSelling";
import { getActiveCatalog } from "@/lib/productCatalog";
import { getActiveWednesdayDeals, getRemainingDealQtyMap, isWednesdayToday } from "@/lib/wednesdayDeals";

export default async function ShopProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; filter?: string; q?: string; focus?: string }>;
}) {
  const session = await requireStoreSession();
  const lang = await getLang();
  const { company, filter, q, focus } = await searchParams;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const db = getOrgScopedDb(session.orgId);
  const [catalog, hotIds, deals, expiryItems] = await Promise.all([
    getActiveCatalog(session.orgId),
    getHotSellingProductIds(session.orgId),
    isWednesdayToday() ? getActiveWednesdayDeals(session.orgId) : Promise.resolve([]),
    db.expiryItem.findMany({
      where: { expiryDate: { gte: today } },
      orderBy: { expiryDate: "asc" },
    }),
  ]);
  const expiryByNormalizedName = new Map<string, string>();
  for (const e of expiryItems) {
    const key = normalizeName(e.itemName);
    if (!expiryByNormalizedName.has(key)) expiryByNormalizedName.set(key, e.expiryDate.toISOString());
  }
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
          autoFocus={focus === "search"}
          companyFilter={company}
          hotOnly={filter === "hot"}
          products={products.map((p) => ({
            ...p,
            hot: hotIds.has(p.id),
            deal: dealByProductId.get(p.id) ?? null,
            expiryDate: expiryByNormalizedName.get(normalizeName(p.name)) ?? null,
          }))}
        />
      </Card>
    </div>
  );
}
