"use client";

import { t, type Lang } from "@/lib/i18n";
import { useOrdersClosed } from "@/components/shop/useOrdersClosed";

// Shown across the whole shop from 5 PM until midnight, so a retailer knows
// before filling a cart that tonight's orders are closed.
export function OrdersClosedBanner({ lang }: { lang: Lang }) {
  const closed = useOrdersClosed();
  if (!closed) return null;

  return (
    <div className="bg-red-700 px-4 py-2 text-center text-sm font-semibold text-white">
      {t(lang, "shop_orders_closed_banner")}
    </div>
  );
}
