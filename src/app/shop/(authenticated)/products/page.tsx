import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { ProductList } from "@/components/shop/ProductList";
import { searchProductCatalog, PRODUCT_PAGE_SIZE } from "@/lib/productSearch";

export default async function ShopProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; filter?: string; q?: string; focus?: string }>;
}) {
  const session = await requireStoreSession();
  const lang = await getLang();
  const { company, filter, q, focus } = await searchParams;
  const hotOnly = filter === "hot";

  const result = await searchProductCatalog(session.orgId, session.storeId, {
    query: q,
    company,
    hotOnly,
    offset: 0,
    limit: PRODUCT_PAGE_SIZE,
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
          initialQuery={q}
          autoFocus={focus === "search"}
          companyFilter={company}
          hotOnly={hotOnly}
          initialProducts={result.products}
          initialHasMore={result.hasMore}
          companies={result.companies}
          salts={result.salts}
        />
      </Card>
    </div>
  );
}
