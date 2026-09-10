"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Flame, Sparkles, ClipboardList, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/shop/SearchableSelect";
import { useCart } from "@/components/shop/CartProvider";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { t, type Lang } from "@/lib/i18n";
import { fetchProductsPage } from "@/actions/catalogSearchActions";
import { PRODUCT_PAGE_SIZE } from "@/lib/productSearchConstants";
import type { SearchProductItem } from "@/lib/productSearch";
import { getCatalogSnapshot } from "@/lib/offlineCatalog";
import { filterOfflineCatalog } from "@/lib/offlineProductFilter";

export type ProductListItem = SearchProductItem;

const LOW_STOCK_THRESHOLD = 3;
const SEARCH_DEBOUNCE_MS = 300;

export function ProductList({
  initialProducts,
  initialHasMore,
  companies,
  salts,
  lang,
  initialQuery = "",
  autoFocus = false,
  companyFilter,
  hotOnly = false,
}: {
  initialProducts: ProductListItem[];
  initialHasMore: boolean;
  companies: string[];
  salts: string[];
  lang: Lang;
  initialQuery?: string;
  autoFocus?: boolean;
  companyFilter?: string;
  hotOnly?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [companyPick, setCompanyPick] = useState(companyFilter ?? "");
  const [saltPick, setSaltPick] = useState("");
  const [expandedAlternatives, setExpandedAlternatives] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<ProductListItem[]>(initialProducts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [companyOptions, setCompanyOptions] = useState(companies);
  const [saltOptions, setSaltOptions] = useState(salts);
  // True once a search actually had to fall back to the on-device catalog
  // snapshot (no signal, or the server action failed) — shown as a small
  // note so the retailer knows prices/stock might be a few hours stale.
  const [usingOfflineSnapshot, setUsingOfflineSnapshot] = useState(false);
  const { items: cartItems, setQuantity } = useCart();
  const cartQuantities = useMemo(
    () => new Map(cartItems.map((i) => [i.productId, i.quantity])),
    [cartItems],
  );

  // Guards against a slow, now-superseded request overwriting the results of
  // a newer one (e.g. two keystrokes fired two searches out of order).
  const requestIdRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const runSearch = useCallback(
    async (filters: { query: string; company: string; salt: string }, offset: number, append: boolean) => {
      const myRequestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const alreadyOffline = typeof navigator !== "undefined" && !navigator.onLine;
        let result: { products: ProductListItem[]; hasMore: boolean; companies?: string[]; salts?: string[] } | null = null;

        if (!alreadyOffline) {
          try {
            result = await fetchProductsPage({
              query: filters.query || undefined,
              company: filters.company || undefined,
              salt: filters.salt || undefined,
              hotOnly,
              offset,
              limit: PRODUCT_PAGE_SIZE,
            });
            if (myRequestId === requestIdRef.current) setUsingOfflineSnapshot(false);
          } catch {
            // Server action unreachable — most likely no signal. Fall
            // through to the on-device snapshot below.
          }
        }

        if (!result) {
          try {
            const snapshot = await getCatalogSnapshot();
            result = filterOfflineCatalog(snapshot, {
              query: filters.query,
              company: filters.company,
              salt: filters.salt,
              offset,
              limit: PRODUCT_PAGE_SIZE,
            });
          } catch {
            // IndexedDB unavailable (rare — some private-browsing modes).
            // No offline fallback possible; show an empty result rather
            // than crash the search.
            result = { products: [], hasMore: false };
          }
          if (myRequestId === requestIdRef.current) setUsingOfflineSnapshot(true);
        }

        if (myRequestId !== requestIdRef.current) return;
        setItems((prev) => (append ? [...prev, ...result.products] : result.products));
        setHasMore(result.hasMore);
        if (result.companies) setCompanyOptions(result.companies);
        if (result.salts) setSaltOptions(result.salts);
      } finally {
        if (myRequestId === requestIdRef.current) setLoading(false);
      }
    },
    [hotOnly],
  );

  // Re-search from scratch whenever the query/company/salt filters change —
  // debounced so typing doesn't fire a request per keystroke. Skips the very
  // first render since the server already fetched that exact page.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const handle = setTimeout(() => {
      runSearch({ query, company: companyPick, salt: saltPick }, 0, false);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, companyPick, saltPick]);

  // Load the next page as soon as the sentinel at the bottom of the list
  // scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          runSearch({ query, company: companyPick, salt: saltPick }, items.length, true);
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, items.length]);

  function toggleAlternatives(productId: string) {
    setExpandedAlternatives((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder={t(lang, "shop_search_products")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus={autoFocus}
      />

      <div className="grid grid-cols-2 gap-2">
        <SearchableSelect
          value={companyPick}
          onChange={setCompanyPick}
          options={companyOptions}
          placeholder={t(lang, "shop_company")}
          allLabel={t(lang, "shop_all_companies")}
        />
        <SearchableSelect
          value={saltPick}
          onChange={setSaltPick}
          options={saltOptions}
          placeholder={t(lang, "shop_salt")}
          allLabel={t(lang, "shop_all_salts")}
        />
      </div>

      {usingOfflineSnapshot && (
        <p className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
          {t(lang, "shop_offline_catalog_notice")}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {items.map((p) => {
          const quantity = cartQuantities.get(p.id) ?? 0;
          const alternatives = p.alternatives;
          const isExpanded = expandedAlternatives.has(p.id);
          return (
            <div key={p.id} className="rounded-xl border-2 border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-900">
                  <span>{p.name}</span>
                  {p.hot && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                      <Flame size={12} strokeWidth={2} />
                      {t(lang, "shop_hot_selling")}
                    </span>
                  )}
                </p>
                {p.composition && <p className="text-xs text-slate-400">{p.composition}</p>}
                <p className="text-sm text-slate-500">
                  {[p.company, p.unit].filter(Boolean).join(" · ") || " "}
                </p>
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-bold text-blue-700">
                    ₹{(p.deal ? p.deal.price : p.price).toLocaleString("en-IN")}
                  </span>
                  {p.deal ? (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{p.price.toLocaleString("en-IN")}
                    </span>
                  ) : (
                    p.mrp != null &&
                    p.mrp > p.price && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{p.mrp.toLocaleString("en-IN")}
                      </span>
                    )
                  )}
                  {p.deal && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                      <Sparkles size={12} strokeWidth={2} />
                      {t(lang, "shop_wednesday_deal")}
                    </span>
                  )}
                  {p.taxPercent != null && (
                    <span className="text-xs text-slate-400">
                      {t(lang, "shop_tax")} {p.taxPercent}%
                    </span>
                  )}
                  {p.stock != null &&
                    (p.stock < LOW_STOCK_THRESHOLD ? (
                      <span className="text-xs font-semibold text-red-600">{t(lang, "shop_low_stock")}</span>
                    ) : (
                      <span className="text-xs font-medium text-green-700">
                        {t(lang, "shop_in_stock")}: {p.stock}
                      </span>
                    ))}
                </p>
                {p.expiryDate && (
                  <p className="text-xs text-slate-400">
                    {t(lang, "shop_expiry")}: {new Date(p.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                )}
                {p.scheme && (
                  <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {t(lang, "shop_scheme")}: {p.scheme}
                  </span>
                )}
                {p.deal && (
                  <p className="mt-1 text-xs font-semibold text-purple-700">
                    {t(lang, "shop_deal_limit_left")}: {p.deal.remainingQty}
                  </p>
                )}
                {alternatives.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleAlternatives(p.id)}
                    className="mt-1 text-xs font-semibold text-blue-700 hover:underline"
                  >
                    {isExpanded
                      ? t(lang, "shop_hide_alternatives")
                      : `${t(lang, "shop_show_alternatives")} (${alternatives.length})`}
                  </button>
                )}
              </div>
              <QuantityStepper
                quantity={quantity}
                onChange={(q) =>
                  setQuantity(
                    {
                      productId: p.id,
                      name: p.name,
                      unitPrice: p.deal ? p.deal.price : p.price,
                      dealId: p.deal?.id,
                    },
                    q,
                  )
                }
                max={p.deal?.remainingQty}
                accentClassName={p.deal ? "bg-purple-700 hover:bg-purple-800" : undefined}
              />
              </div>
              {isExpanded && alternatives.length > 0 && (
                <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                  {alternatives.map((alt) => {
                    const altQuantity = cartQuantities.get(alt.id) ?? 0;
                    return (
                      <div
                        key={alt.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">{alt.name}</p>
                          <p className="text-xs text-slate-500">{alt.company ?? ""}</p>
                          <p className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-blue-700">
                              ₹{alt.price.toLocaleString("en-IN")}
                            </span>
                            {alt.stock != null &&
                              (alt.stock < LOW_STOCK_THRESHOLD ? (
                                <span className="text-xs font-semibold text-red-600">{t(lang, "shop_low_stock")}</span>
                              ) : (
                                <span className="text-xs font-medium text-green-700">
                                  {t(lang, "shop_in_stock")}: {alt.stock}
                                </span>
                              ))}
                          </p>
                        </div>
                        <QuantityStepper
                          quantity={altQuantity}
                          onChange={(q) => setQuantity({ productId: alt.id, name: alt.name, unitPrice: alt.price }, q)}
                          compact
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && !loading && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-slate-400">{t(lang, "shop_no_products_found")}</p>
            <Link
              href={`/shop/request-product${query.trim() ? `?product=${encodeURIComponent(query.trim())}` : ""}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700 hover:bg-teal-100"
            >
              <ClipboardList size={16} strokeWidth={1.75} />
              {t(lang, "shop_recommend_product")}
            </Link>
          </div>
        )}
        {hasMore && <div ref={sentinelRef} aria-hidden className="h-1" />}
        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        )}
      </div>
    </div>
  );
}
