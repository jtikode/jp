"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Flame, Sparkles, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/shop/SearchableSelect";
import { useCart } from "@/components/shop/CartProvider";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { t, type Lang } from "@/lib/i18n";
import { cascadingProductSearch } from "@/lib/fuzzySearch";

export interface ProductListItem {
  id: string;
  name: string;
  company: string | null;
  unit: string | null;
  price: number;
  mrp: number | null;
  taxPercent: number | null;
  scheme: string | null;
  composition: string | null;
  stock: number | null;
  hot: boolean;
  // Present only when it's Wednesday and this product has an active deal
  // the store hasn't fully used up yet.
  deal?: { id: string; price: number; remainingQty: number } | null;
  expiryDate?: string | null;
}

const LOW_STOCK_THRESHOLD = 3;

export function ProductList({
  products,
  lang,
  initialQuery = "",
  autoFocus = false,
  companyFilter,
  hotOnly = false,
}: {
  products: ProductListItem[];
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
  const { items, setQuantity } = useCart();
  const cartQuantities = useMemo(
    () => new Map(items.map((i) => [i.productId, i.quantity])),
    [items],
  );

  const companies = useMemo(
    () => [...new Set(products.map((p) => p.company).filter((c): c is string => !!c))].sort(),
    [products],
  );
  const salts = useMemo(
    () => [...new Set(products.map((p) => p.composition).filter((c): c is string => !!c))].sort(),
    [products],
  );

  const companyScoped = useMemo(() => {
    let scoped = products;
    if (companyPick) scoped = scoped.filter((p) => p.company === companyPick);
    if (saltPick) scoped = scoped.filter((p) => p.composition === saltPick);
    if (hotOnly) scoped = scoped.filter((p) => p.hot);
    return scoped;
  }, [products, companyPick, saltPick, hotOnly]);

  // Out-of-stock products are hidden from ordinary browsing/search — they
  // only reappear when the retailer types the exact product name, so an
  // exact lookup still confirms the item exists (as "Low Stock") without
  // cluttering everyday browsing with things that can't be fulfilled.
  const stockVisible = useMemo(() => {
    const exactQuery = query.trim().toLowerCase();
    return companyScoped.filter(
      (p) => p.stock == null || p.stock > 0 || (exactQuery.length > 0 && p.name.trim().toLowerCase() === exactQuery),
    );
  }, [companyScoped, query]);

  const filtered = useMemo(
    () => cascadingProductSearch(stockVisible, query, (p) => p.name, (p) => p.composition),
    [stockVisible, query],
  );

  const alternativesByComposition = useMemo(() => {
    const map = new Map<string, ProductListItem[]>();
    for (const p of products) {
      const key = p.composition?.trim().toLowerCase();
      if (!key) continue;
      const group = map.get(key) ?? [];
      group.push(p);
      map.set(key, group);
    }
    return map;
  }, [products]);

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
          options={companies}
          placeholder={t(lang, "shop_company")}
          allLabel={t(lang, "shop_all_companies")}
        />
        <SearchableSelect
          value={saltPick}
          onChange={setSaltPick}
          options={salts}
          placeholder={t(lang, "shop_salt")}
          allLabel={t(lang, "shop_all_salts")}
        />
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((p) => {
          const quantity = cartQuantities.get(p.id) ?? 0;
          const compositionKey = p.composition?.trim().toLowerCase();
          const alternatives = compositionKey
            ? (alternativesByComposition.get(compositionKey) ?? []).filter((alt) => alt.id !== p.id)
            : [];
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
                  {[p.company, p.unit].filter(Boolean).join(" · ") || " "}
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
                          <span className="text-xs font-medium text-blue-700">
                            ₹{alt.price.toLocaleString("en-IN")}
                          </span>
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
        {filtered.length === 0 && (
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
      </div>
    </div>
  );
}
