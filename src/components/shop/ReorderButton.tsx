"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getReorderLines } from "@/actions/orderActions";
import { useCart } from "@/components/shop/CartProvider";
import { t, type Lang } from "@/lib/i18n";

export function ReorderButton({ orderId, lang }: { orderId: string; lang: Lang }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setQuantity } = useCart();
  const router = useRouter();

  async function handleReorder() {
    setPending(true);
    setError(null);
    const result = await getReorderLines(orderId);
    setPending(false);

    if (!result.ok || !result.lines) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    for (const line of result.lines) {
      setQuantity({ productId: line.productId, name: line.name, unitPrice: line.unitPrice }, line.quantity);
    }

    if (result.unavailable && result.unavailable.length > 0) {
      setError(`${t(lang, "shop_reorder_unavailable")}: ${result.unavailable.join(", ")}`);
    }

    router.push("/shop/checkout");
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleReorder}
        disabled={pending}
        className="rounded-lg border-2 border-blue-700 bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? t(lang, "shop_reordering") : t(lang, "shop_reorder")}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-amber-700">{error}</p>}
    </div>
  );
}
