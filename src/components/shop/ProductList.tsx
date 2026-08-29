"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
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
}

const LOW_STOCK_THRESHOLD = 3;

export function ProductList({
  products,
  lang,
  initialQuery = "",
  companyFilter,
  hotOnly = false,
}: {
  products: ProductListItem[];
  lang: Lang;
  initialQuery?: string;
  companyFilter?: string;
  hotOnly?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [expandedAlternatives, setExpandedAlternatives] = useState<Set<string>>(new Set());
  const { items, setQuantity } = useCart();
  const cartQuantities = useMemo(
    () => new Map(items.map((i) => [i.productId, i.quantity])),
    [items],
  );

  const companyScoped = useMemo(() => {
    let scoped = products;
    if (companyFilter) scoped = scoped.filter((p) => p.company === companyFilter);
    if (hotOnly) scoped = scoped.filter((p) => p.hot);
    return scoped;
  }, [products, companyFilter, hotOnly]);

  const filtered = useMemo(
    () => cascadingProductSearch(companyScoped, query, (p) => p.name, (p) => p.composition),
    [companyScoped, query],
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
      />

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
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                      🔥 {t(lang, "shop_hot_selling")}
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
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                      🎉 {t(lang, "shop_wednesday_deal")}
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
                {p.scheme && (
                  <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {p.scheme}
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
          <p className="py-6 text-center text-slate-400">{t(lang, "shop_no_products_found")}</p>
        )}
      </div>
    </div>
  );
}
