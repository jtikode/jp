"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/components/shop/CartProvider";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { t, type Lang } from "@/lib/i18n";
import { cascadingProductSearch } from "@/lib/fuzzySearch";

const LOW_STOCK_THRESHOLD = 3;
const MAX_RESULTS = 15;

export interface QuickCheckItem {
  id: string;
  name: string;
  company: string | null;
  unit: string | null;
  price: number;
  mrp: number | null;
  composition: string | null;
  stock: number | null;
}

export function QuickCheckList({ products, lang }: { products: QuickCheckItem[]; lang: Lang }) {
  const [query, setQuery] = useState("");
  const { items, setQuantity } = useCart();
  const cartQuantities = useMemo(
    () => new Map(items.map((i) => [i.productId, i.quantity])),
    [items],
  );

  const alternativesByComposition = useMemo(() => {
    const map = new Map<string, QuickCheckItem[]>();
    for (const p of products) {
      const key = p.composition?.trim().toLowerCase();
      if (!key) continue;
      const group = map.get(key) ?? [];
      group.push(p);
      map.set(key, group);
    }
    for (const group of map.values()) group.sort((a, b) => a.price - b.price);
    return map;
  }, [products]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return cascadingProductSearch(products, query, (p) => p.name, (p) => p.composition).slice(
      0,
      MAX_RESULTS,
    );
  }, [products, query]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        autoFocus
        placeholder={t(lang, "shop_quick_check_placeholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-lg"
      />

      {!query.trim() && (
        <p className="py-8 text-center text-slate-400">{t(lang, "shop_quick_check_prompt")}</p>
      )}

      {query.trim() && results.length === 0 && (
        <p className="py-8 text-center text-slate-400">{t(lang, "shop_no_products_found")}</p>
      )}

      {results.map((p) => {
        const quantity = cartQuantities.get(p.id) ?? 0;
        const compositionKey = p.composition?.trim().toLowerCase();
        const cheaperAlternatives = compositionKey
          ? (alternativesByComposition.get(compositionKey) ?? [])
              .filter((alt) => alt.id !== p.id && alt.price < p.price)
              .slice(0, 3)
          : [];

        return (
          <div key={p.id} className="rounded-xl border-2 border-blue-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-slate-900">{p.name}</p>
                <p className="text-sm text-slate-500">
                  {[p.company, p.unit].filter(Boolean).join(" · ") || " "}
                </p>
                {p.composition && <p className="text-xs text-slate-400">{p.composition}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-slate-500">{t(lang, "shop_your_rate")}</p>
                <p className="text-2xl font-extrabold text-blue-700">
                  ₹{p.price.toLocaleString("en-IN")}
                </p>
                {p.mrp != null && p.mrp > p.price && (
                  <p className="text-xs text-slate-400 line-through">
                    MRP ₹{p.mrp.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p>
                {p.stock != null &&
                  (p.stock < LOW_STOCK_THRESHOLD ? (
                    <span className="text-sm font-bold text-red-600">{t(lang, "shop_low_stock")}</span>
                  ) : (
                    <span className="text-sm font-semibold text-green-700">
                      {t(lang, "shop_in_stock")}: {p.stock}
                    </span>
                  ))}
              </p>
              <QuantityStepper
                quantity={quantity}
                onChange={(q) => setQuantity({ productId: p.id, name: p.name, unitPrice: p.price }, q)}
              />
            </div>

            {cheaperAlternatives.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="mb-1.5 text-xs font-bold text-lime-700">{t(lang, "shop_cheaper_alternatives")}</p>
                <div className="flex flex-col gap-1">
                  {cheaperAlternatives.map((alt) => (
                    <div key={alt.id} className="flex items-center justify-between text-sm">
                      <span className="min-w-0 truncate text-slate-700">
                        {alt.name} {alt.company ? `· ${alt.company}` : ""}
                      </span>
                      <span className="shrink-0 font-bold text-lime-700">
                        ₹{alt.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
