"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/components/shop/CartProvider";
import { t, type Lang } from "@/lib/i18n";
import type { FastOrderItem } from "@/actions/orderActions";

const LOW_STOCK_THRESHOLD = 3;

export function FastOrderList({ items, lang }: { items: FastOrderItem[]; lang: Lang }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { setQuantity } = useCart();
  const router = useRouter();

  const selectedCount = Object.values(quantities).filter((q) => q > 0).length;

  function handleAddAndCheckout() {
    for (const item of items) {
      const qty = quantities[item.productId] ?? 0;
      if (qty > 0) {
        setQuantity({ productId: item.productId, name: item.name, unitPrice: item.unitPrice }, qty);
      }
    }
    router.push("/shop/checkout");
  }

  if (items.length === 0) {
    return <p className="py-6 text-center text-slate-400">{t(lang, "shop_no_fast_order_items")}</p>;
  }

  return (
    <div className="flex flex-col gap-3 pb-20">
      {items.map((item) => (
        <div
          key={item.productId}
          className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{item.name}</p>
            <p className="text-sm text-slate-500">{item.company ?? ""}</p>
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-medium text-blue-700">
                ₹{item.unitPrice.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-slate-400">
                {t(lang, "shop_usual_qty")}: {item.usualQuantity}
              </span>
            </p>
            {item.stock != null &&
              (item.stock < LOW_STOCK_THRESHOLD ? (
                <p className="text-xs font-semibold text-red-600">{t(lang, "shop_low_stock")}</p>
              ) : (
                <p className="text-xs text-slate-400">
                  {t(lang, "shop_in_stock")}: {item.stock}
                </p>
              ))}
          </div>
          <Input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={quantities[item.productId] ?? ""}
            onChange={(e) =>
              setQuantities((prev) => ({ ...prev, [item.productId]: Math.max(0, Number(e.target.value) || 0) }))
            }
            placeholder="0"
            className="w-20 text-center"
          />
        </div>
      ))}

      <div className="fixed inset-x-0 bottom-16 z-10 border-t-2 border-slate-200 bg-white p-3">
        <button
          type="button"
          onClick={handleAddAndCheckout}
          disabled={selectedCount === 0}
          className="mx-auto flex w-full max-w-2xl items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-base font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t(lang, "shop_add_to_cart_checkout")}
          {selectedCount > 0 ? ` (${selectedCount})` : ""}
        </button>
      </div>
    </div>
  );
}
