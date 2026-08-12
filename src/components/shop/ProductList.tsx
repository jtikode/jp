"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/components/shop/CartProvider";
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
}

const LOW_STOCK_THRESHOLD = 3;

export function ProductList({
  products,
  lang,
  initialQuery = "",
  companyFilter,
}: {
  products: ProductListItem[];
  lang: Lang;
  initialQuery?: string;
  companyFilter?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [expandedAlternatives, setExpandedAlternatives] = useState<Set<string>>(new Set());
  const { items, setQuantity } = useCart();
  const cartQuantities = useMemo(
    () => new Map(items.map((i) => [i.productId, i.quantity])),
    [items],
  );

  const companyScoped = useMemo(
    () => (companyFilter ? products.filter((p) => p.company === companyFilter) : products),
    [products, companyFilter],
  );

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
                <p className="font-semibold text-slate-900">{p.name}</p>
                {p.composition && <p className="text-xs text-slate-400">{p.composition}</p>}
                <p className="text-sm text-slate-500">
                  {[p.company, p.unit].filter(Boolean).join(" · ") || " "}
                </p>
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-bold text-blue-700">
                    ₹{p.price.toLocaleString("en-IN")}
                  </span>
                  {p.mrp != null && p.mrp > p.price && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{p.mrp.toLocaleString("en-IN")}
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
              <div className="flex shrink-0 items-center gap-1 rounded-full border-2 border-slate-200 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity({ productId: p.id, name: p.name, unitPrice: p.price }, Math.max(0, quantity - 1))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-slate-700 hover:bg-slate-100"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-8 text-center text-lg font-semibold text-slate-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity({ productId: p.id, name: p.name, unitPrice: p.price }, quantity + 1)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white hover:bg-blue-800"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
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
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(
                              { productId: alt.id, name: alt.name, unitPrice: alt.price },
                              altQuantity + 1,
                            )
                          }
                          className="shrink-0 rounded-lg border-2 border-blue-700 bg-blue-700 px-3 py-1 text-xs font-bold text-white hover:bg-blue-800"
                        >
                          {altQuantity > 0 ? `${t(lang, "shop_qty")}: ${altQuantity}` : "+"}
                        </button>
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
