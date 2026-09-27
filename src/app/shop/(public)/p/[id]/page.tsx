import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flame, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProductThumb } from "@/components/shop/ProductList";
import { PublicAddToCart } from "@/components/shop/PublicAddToCart";
import { getActiveCatalog } from "@/lib/productCatalog";
import { getDefaultOrgId } from "@/lib/defaultOrg";
import { getHotSellingProductIds } from "@/lib/hotSelling";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { LOW_STOCK_THRESHOLD, isNearExpiry } from "@/lib/stockRank";

async function getProduct(id: string) {
  const orgId = await getDefaultOrgId();
  const catalog = await getActiveCatalog(orgId);
  const product = catalog.find((p) => p.id === id);
  if (!product) return null;

  const compKey = product.composition?.trim().toLowerCase();
  const alternatives = compKey
    ? catalog.filter((p) => p.id !== product.id && p.composition?.trim().toLowerCase() === compKey)
    : [];

  const hotIds = await getHotSellingProductIds(orgId);
  const hot = hotIds.has(product.id);

  return { product, alternatives, hot };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getProduct(id);
  if (!data) return { title: "Product not found" };

  const { product } = data;
  return {
    title: `${product.name} — J P Traders`,
    description: [product.composition, product.company].filter(Boolean).join(" · ") || undefined,
    // Deliberately kept out of search results: this page exists so a direct
    // link (WhatsApp, SMS) opens straight to one product without a login
    // wall, not so competitors can crawl the whole catalog's rates off Google.
    robots: { index: false, follow: false },
  };
}

export default async function PublicProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lang = await getLang();
  const data = await getProduct(id);
  if (!data) notFound();
  const { product: p, alternatives, hot } = data;

  return (
    <div className="min-h-dvh bg-slate-100">
      <header className="flex items-center justify-between gap-2 bg-white px-4 py-3 shadow-sm">
        <span className="text-lg font-bold text-slate-900">J P Traders</span>
        <Link
          href="/shop/login"
          className="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {p.imageUrl ? (
            <div className="mx-auto sm:mx-0">
              <ProductThumb src={p.imageUrl} alt={p.name} size={160} />
            </div>
          ) : (
            <div className="mx-auto flex h-40 w-40 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-xs text-slate-400 sm:mx-0">
              No photo
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-1.5 text-xl font-bold text-slate-900">
              <span>{p.name}</span>
              {hot && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                  <Flame size={12} strokeWidth={2} />
                  {t(lang, "shop_hot_selling")}
                </span>
              )}
            </p>
            {p.composition && <p className="mt-1 text-sm text-slate-500">{p.composition}</p>}
            <p className="mt-1 text-sm text-slate-500">{[p.company, p.unit].filter(Boolean).join(" · ")}</p>

            <p className="mt-3 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-700">
                {p.price > 0 ? `₹${p.price.toLocaleString("en-IN")}` : "—"}
              </span>
              {p.price <= 0
                ? p.mrp != null && (
                    <span className="text-sm font-medium text-slate-500">MRP ₹{p.mrp.toLocaleString("en-IN")}</span>
                  )
                : p.mrp != null &&
                  p.mrp > p.price && (
                    <span className="text-sm text-slate-400 line-through">₹{p.mrp.toLocaleString("en-IN")}</span>
                  )}
              {p.taxPercent != null && (
                <span className="text-xs text-slate-400">
                  {t(lang, "shop_tax")} {p.taxPercent}%
                </span>
              )}
            </p>

            <p className="mt-2">
              {p.onRequest ? (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {t(lang, "shop_available_on_request")}
                </span>
              ) : (
                p.stock != null &&
                (p.stock < LOW_STOCK_THRESHOLD ? (
                  <span className="text-xs font-semibold text-red-600">{t(lang, "shop_low_stock")}</span>
                ) : (
                  <span className="text-xs font-medium text-green-700">
                    {t(lang, "shop_in_stock")}: {p.stock}
                  </span>
                ))
              )}
            </p>

            {p.nearestExpiry && (
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                <span>
                  {t(lang, "shop_expiry")}:{" "}
                  {new Date(p.nearestExpiry).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </span>
                {isNearExpiry({ stock: p.stock, expiryDate: p.nearestExpiry }) && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-700">
                    {t(lang, "shop_near_expiry")}
                  </span>
                )}
              </p>
            )}

            <div className="mt-1 flex flex-wrap gap-1.5">
              {p.category && (
                <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {p.category}
                </span>
              )}
              {p.scheme && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  <Sparkles size={12} strokeWidth={2} />
                  {t(lang, "shop_scheme")}: {p.scheme}
                </span>
              )}
            </div>

            <div className="mt-4">
              <PublicAddToCart productId={p.id} name={p.name} unitPrice={p.price} lang={lang} />
            </div>
          </div>
        </Card>

        {alternatives.length > 0 && (
          <Card>
            <h2 className="mb-3 text-sm font-bold text-slate-900">
              {t(lang, "shop_show_alternatives")} ({alternatives.length})
            </h2>
            <div className="flex flex-col gap-2">
              {alternatives.map((alt) => (
                <Link
                  key={alt.id}
                  href={`/shop/p/${alt.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2 hover:bg-slate-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{alt.name}</p>
                    <p className="text-xs text-slate-500">{[alt.company, alt.unit].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-blue-700">
                    {alt.price > 0 ? `₹${alt.price.toLocaleString("en-IN")}` : "—"}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        )}

        <p className="text-center text-xs text-slate-400">
          <Link href="/shop/login" className="font-semibold text-blue-700 hover:underline">
            {t(lang, "shop_public_browse_catalog")}
          </Link>
        </p>
      </main>
    </div>
  );
}
