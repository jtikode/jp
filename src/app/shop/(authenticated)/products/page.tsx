import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { ProductList } from "@/components/shop/ProductList";
import Link from "next/link";
import { getCategoryTile, tileName } from "@/lib/categoryTiles";
import { searchProductCatalog, PRODUCT_PAGE_SIZE } from "@/lib/productSearch";

export default async function ShopProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; filter?: string; q?: string; focus?: string; tile?: string }>;
}) {
  const session = await requireStoreSession();
  const lang = await getLang();
  const { company, filter, q, focus, tile: tileParam } = await searchParams;
  const tile = getCategoryTile(tileParam);
  const hotOnly = filter === "hot";

  const result = await searchProductCatalog(session.orgId, session.storeId, {
    query: q,
    company,
    tile: tile?.slug,
    hotOnly,
    offset: 0,
    limit: PRODUCT_PAGE_SIZE,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">
          {tile ? tileName(tile, lang) : t(lang, "shop_catalog_heading")}
        </h1>
        {tile ? (
          <Link href="/shop/products" className="mt-1 inline-block text-sm font-semibold text-blue-700 underline">
            {t(lang, "shop_all_categories")}
          </Link>
        ) : (
          <p className="mt-1 text-sm text-slate-500">{t(lang, "shop_catalog_subtitle")}</p>
        )}
      </Card>

      <Card>
        <ProductList
          key={tile?.slug ?? "all"}
          lang={lang}
          initialQuery={q}
          autoFocus={focus === "search"}
          companyFilter={company}
          tileFilter={tile?.slug}
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
