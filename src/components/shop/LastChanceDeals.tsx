"use client";

import { useState } from "react";
import { useCart } from "@/components/shop/CartProvider";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { t, type Lang } from "@/lib/i18n";
import type { LastChanceDeal } from "@/lib/lastChanceDeals";

const MAX_SHOWN = 8;

// "Last-chance deals" strip at the end of the cart: near-expiry items at their
// clearance rate that the retailer can add to this order with one tap. Items
// from companies already in the cart come first, then the biggest discounts.
// The set is chosen once when the cart opens so cards do not jump around while
// the retailer adds things.
export function LastChanceDeals({ deals, lang }: { deals: LastChanceDeal[]; lang: Lang }) {
  const { items, setQuantity } = useCart();
  const [shown] = useState<LastChanceDeal[]>(() => {
    const inCart = new Set(items.map((i) => i.productId));
    const companies = new Set(
      deals.filter((d) => inCart.has(d.productId)).map((d) => d.company).filter((c): c is string => !!c),
    );
    return deals
      .filter((d) => !inCart.has(d.productId))
      .sort((a, b) => Number(companies.has(b.company ?? "")) - Number(companies.has(a.company ?? "")) || b.percentOff - a.percentOff)
      .slice(0, MAX_SHOWN);
  });

  if (shown.length === 0) return null;
  const qtyOf = (id: string) => items.find((i) => i.productId === id)?.quantity ?? 0;

  return (
    <section className="rounded-2xl border-2 border-red-200 bg-red-50 p-3">
      <h2 className="text-base font-bold text-red-800">{t(lang, "shop_lastchance_title")}</h2>
      <p className="mb-2 text-xs text-red-700">{t(lang, "shop_lastchance_sub")}</p>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {shown.map((d) => {
          const urgency = d.daysLeft <= 30 ? "text-red-700" : "text-slate-500";
          return (
            <div key={d.expiryItemId} className="flex w-44 shrink-0 flex-col justify-between rounded-xl border border-red-100 bg-white p-2.5">
              <div>
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {d.percentOff}% {t(lang, "shop_percent_off")}
                </span>
                <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-tight text-slate-900">{d.name}</p>
                <p className="truncate text-xs text-slate-500">{[d.company, d.unit].filter(Boolean).join(" · ")}</p>
                <p className={`text-[11px] font-semibold ${urgency}`}>
                  {t(lang, "shop_expires")} {new Date(d.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="leading-tight">
                  <span className="block text-base font-bold text-red-700">₹{d.specialRate.toLocaleString("en-IN")}</span>
                  <span className="text-xs text-slate-400 line-through">₹{d.normalPrice.toLocaleString("en-IN")}</span>
                </p>
                <QuantityStepper
                  compact
                  quantity={qtyOf(d.productId)}
                  max={d.stock ?? undefined}
                  onChange={(q) =>
                    setQuantity({ productId: d.productId, name: d.name, unitPrice: d.specialRate, expiryItemId: d.expiryItemId }, q)
                  }
                  accentClassName="bg-red-700 hover:bg-red-800"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
