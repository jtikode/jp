"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useCart } from "@/components/shop/CartProvider";
import { t, type Lang } from "@/lib/i18n";
import type { OneTapReorderData } from "@/actions/orderActions";

export function OneTapReorderCard({ data, lang }: { data: OneTapReorderData; lang: Lang }) {
  const [pending, setPending] = useState(false);
  const { setQuantity } = useCart();
  const router = useRouter();

  if (data.source === "none") return null;

  function handleReorder() {
    setPending(true);
    for (const line of data.lines) {
      setQuantity({ productId: line.productId, name: line.name, unitPrice: line.unitPrice }, line.quantity);
    }
    router.push("/shop/checkout");
  }

  const subtitle =
    data.source === "last_order"
      ? `${t(lang, "shop_onetap_reorder_last_order")}${
          data.orderDate ? ` (${new Date(data.orderDate).toLocaleDateString("en-IN")})` : ""
        }`
      : t(lang, "shop_onetap_reorder_frequent");

  return (
    <Card className="border-2 border-blue-100 bg-blue-50/40">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <RotateCcw size={20} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900">{t(lang, "shop_onetap_reorder_heading")}</p>
          <p className="truncate text-sm text-slate-500">
            {subtitle} · {data.lines.length} {t(lang, "shop_onetap_reorder_items")}
          </p>
        </div>
      </div>

      {data.unavailable.length > 0 && (
        <p className="mt-2 text-xs font-medium text-amber-700">
          {t(lang, "shop_reorder_unavailable")}: {data.unavailable.join(", ")}
        </p>
      )}

      <button
        type="button"
        onClick={handleReorder}
        disabled={pending}
        className="mt-3 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? t(lang, "shop_reordering") : t(lang, "shop_onetap_reorder_button")}
      </button>
    </Card>
  );
}
