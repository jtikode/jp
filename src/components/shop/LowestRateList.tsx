"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/components/shop/CartProvider";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { t, type Lang } from "@/lib/i18n";

const LOW_STOCK_THRESHOLD = 3;

export interface LowestRateItem {
  id: string;
  name: string;
  company: string | null;
  unit: string | null;
  price: number;
  stock: number | null;
}

export interface LowestRateGroup {
  composition: string;
  items: LowestRateItem[];
}

export function LowestRateList({ groups, lang }: { groups: LowestRateGroup[]; lang: Lang }) {
  const [query, setQuery] = useState("");
  const { items, setQuantity } = useCart();
  const cartQuantities = useMemo(
    () => new Map(items.map((i) => [i.productId, i.quantity])),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        composition: g.composition,
        items: g.composition.toLowerCase().includes(q)
          ? g.items
          : g.items.filter((i) => i.name.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder={t(lang, "shop_search_composition")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.map((group) => (
        <div key={group.composition} className="rounded-xl border-2 border-slate-200 bg-white p-3">
          <p className="mb-2 text-sm font-bold text-slate-700">{group.composition}</p>
          <div className="flex flex-col gap-2">
            {group.items.map((p, index) => {
              const quantity = cartQuantities.get(p.id) ?? 0;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-900">
                      <span>{p.name}</span>
                      {index === 0 && (
                        <span className="rounded-full bg-lime-100 px-2 py-0.5 text-xs font-bold text-lime-800">
                          {t(lang, "shop_best_price")}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {[p.company, p.unit].filter(Boolean).join(" · ") || " "}
                    </p>
                    <p className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-bold text-blue-700">
                        ₹{p.price.toLocaleString("en-IN")}
                      </span>
                      {p.stock != null &&
                        (p.stock < LOW_STOCK_THRESHOLD ? (
                          <span className="text-xs font-semibold text-red-600">{t(lang, "shop_low_stock")}</span>
                        ) : (
                          <span className="text-xs font-medium text-green-700">
                            {t(lang, "shop_in_stock")}: {p.stock}
                          </span>
                        ))}
                    </p>
                  </div>
                  <QuantityStepper
                    quantity={quantity}
                    onChange={(q) => setQuantity({ productId: p.id, name: p.name, unitPrice: p.price }, q)}
                    compact
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="py-6 text-center text-slate-400">{t(lang, "shop_no_lowest_rate_items")}</p>
      )}
    </div>
  );
}
