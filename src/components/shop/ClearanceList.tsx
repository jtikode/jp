"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/components/shop/CartProvider";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { t, type Lang } from "@/lib/i18n";

const LOW_STOCK_THRESHOLD = 3;

export interface ClearanceItem {
  expiryItemId: string;
  productId: string;
  name: string;
  company: string | null;
  unit: string | null;
  normalPrice: number;
  specialRate: number | null;
  stock: number | null;
  expiryDate: string;
  daysLeft: number;
}

export function ClearanceList({ items, lang }: { items: ClearanceItem[]; lang: Lang }) {
  const [query, setQuery] = useState("");
  const { items: cartItems, setQuantity } = useCart();
  const cartQuantities = useMemo(
    () => new Map(cartItems.map((i) => [i.productId, i.quantity])),
    [cartItems],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => `${i.name} ${i.company ?? ""}`.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder={t(lang, "shop_search_products")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.map((p) => {
        const quantity = cartQuantities.get(p.productId) ?? 0;
        const price = p.specialRate ?? p.normalPrice;
        const urgency =
          p.daysLeft <= 7 ? "text-red-700" : p.daysLeft <= 30 ? "text-amber-700" : "text-slate-500";
        return (
          <div
            key={p.expiryItemId}
            className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{p.name}</p>
              <p className="text-sm text-slate-500">
                {[p.company, p.unit].filter(Boolean).join(" · ") || " "}
              </p>
              <p className={`text-xs font-semibold ${urgency}`}>
                {t(lang, "shop_expires")}: {new Date(p.expiryDate).toLocaleDateString("en-IN")} (
                {p.daysLeft}d)
              </p>
              <p className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-bold text-red-700">₹{price.toLocaleString("en-IN")}</span>
                {p.specialRate != null && p.specialRate < p.normalPrice && (
                  <span className="text-xs text-slate-400 line-through">
                    ₹{p.normalPrice.toLocaleString("en-IN")}
                  </span>
                )}
                {p.specialRate != null && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                    {t(lang, "shop_clearance")}
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
            </div>
            <QuantityStepper
              quantity={quantity}
              onChange={(q) =>
                setQuantity(
                  { productId: p.productId, name: p.name, unitPrice: price, expiryItemId: p.expiryItemId },
                  q,
                )
              }
              accentClassName="bg-red-700 hover:bg-red-800"
            />
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p className="py-6 text-center text-slate-400">{t(lang, "shop_no_products_found")}</p>
      )}
    </div>
  );
}
