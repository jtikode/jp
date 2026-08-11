"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/components/shop/CartProvider";
import { t, type Lang } from "@/lib/i18n";

export interface ProductListItem {
  id: string;
  name: string;
  company: string | null;
  unit: string | null;
  price: number;
  mrp: number | null;
  taxPercent: number | null;
  scheme: string | null;
}

export function ProductList({
  products,
  lang,
  initialQuery = "",
}: {
  products: ProductListItem[];
  lang: Lang;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const { items, setQuantity } = useCart();
  const cartQuantities = useMemo(
    () => new Map(items.map((i) => [i.productId, i.quantity])),
    [items],
  );

  const filtered = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.company?.toLowerCase().includes(query.toLowerCase()),
      )
    : products;

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
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{p.name}</p>
                <p className="text-sm text-slate-500">
                  {[p.company, p.unit].filter(Boolean).join(" · ") || " "}
                </p>
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium text-blue-700">
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
                </p>
                {p.scheme && (
                  <p className="text-xs font-medium text-green-700">
                    {t(lang, "shop_scheme")}: {p.scheme}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity({ productId: p.id, name: p.name, unitPrice: p.price }, Math.max(0, quantity - 1))
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-slate-300 text-lg font-bold text-slate-700 hover:bg-slate-50"
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
                  className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-blue-700 bg-blue-700 text-lg font-bold text-white hover:bg-blue-800"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
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
