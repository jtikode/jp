"use client";

import { t, type Lang } from "@/lib/i18n";
import { useBillingClosed } from "@/components/shop/useBillingClosed";

// Shown across the whole shop from 5 PM until midnight, so a retailer knows
// billing is closed for the day. Orders are still accepted.
export function BillingClosedBanner({ lang }: { lang: Lang }) {
  const closed = useBillingClosed();
  if (!closed) return null;

  return (
    <div className="bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-slate-900">
      {t(lang, "shop_billing_closed_banner")}
    </div>
  );
}
