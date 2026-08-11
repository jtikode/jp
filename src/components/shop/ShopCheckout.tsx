"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useCart } from "@/components/shop/CartProvider";
import { placeOrder } from "@/actions/orderActions";
import { t, type Lang } from "@/lib/i18n";

export function ShopCheckout({ lang }: { lang: Lang }) {
  const router = useRouter();
  const { items, setQuantity, removeItem, clear, total } = useCart();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  async function handlePlaceOrder() {
    setError(null);
    setPlacing(true);
    try {
      const result = await placeOrder(
        items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        notes,
      );
      if (!result.ok) {
        setError(result.error ?? "Could not place order.");
        return;
      }
      clear();
      router.push(`/shop/orders/${result.orderId}`);
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <p className="py-6 text-center text-slate-400">{t(lang, "shop_cart_empty")}</p>
          <Link
            href="/shop/products"
            className="mx-auto block w-fit rounded-lg bg-blue-700 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            {t(lang, "shop_browse_catalog")}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_your_cart")}</h1>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">{t(lang, "shop_item")}</th>
              <th className="py-2 pr-4">{t(lang, "shop_qty")}</th>
              <th className="py-2 pr-4">{t(lang, "shop_line_total")}</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.productId} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{i.name}</td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    min={1}
                    value={i.quantity}
                    onChange={(e) =>
                      setQuantity(
                        { productId: i.productId, name: i.name, unitPrice: i.unitPrice },
                        Math.max(1, Number(e.target.value) || 1),
                      )
                    }
                    className="w-16 rounded-lg border-2 border-slate-300 px-2 py-1 text-sm"
                  />
                </td>
                <td className="py-2 pr-4 text-slate-600">
                  ₹{(i.unitPrice * i.quantity).toLocaleString("en-IN")}
                </td>
                <td className="py-2 pr-4">
                  <button
                    type="button"
                    onClick={() => removeItem(i.productId)}
                    className="text-sm font-semibold text-red-600 hover:underline"
                  >
                    {t(lang, "shop_remove")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end">
          <p className="text-lg font-bold text-slate-900">
            {t(lang, "shop_total")}: ₹{total.toLocaleString("en-IN")}
          </p>
        </div>
      </Card>

      <Card>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t(lang, "shop_notes_optional")}
        </label>
        <Textarea
          rows={3}
          placeholder={t(lang, "shop_notes_placeholder")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Card>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <Button onClick={handlePlaceOrder} disabled={placing} className="w-full">
        {placing ? t(lang, "shop_placing_order") : t(lang, "shop_place_order")}
      </Button>
    </div>
  );
}
