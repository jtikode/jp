import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";

export interface WednesdayDealCard {
  productId: string;
  productName: string;
  dealPrice: number;
  normalPrice: number;
  remainingQty: number;
}

// Sits above the hero banner carousel on the shop home page, Wednesdays
// only. Each card is its own banner for one specific deal — tapping it
// jumps straight to that product in the catalog (via the existing search
// box, pre-filled through the ?q= param) rather than a generic deals page.
export function WednesdayDealsStrip({ deals, lang }: { deals: WednesdayDealCard[]; lang: Lang }) {
  if (deals.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-purple-300 bg-purple-50 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-purple-800">
        🎉 {t(lang, "shop_wednesday_deals_heading")}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {deals.map((d) => (
          <Link
            key={d.productId}
            href={`/shop/products?q=${encodeURIComponent(d.productName)}`}
            className="w-40 shrink-0 rounded-xl border-2 border-purple-200 bg-white p-3 hover:border-purple-400"
          >
            <p className="truncate text-sm font-semibold text-slate-900">{d.productName}</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-purple-700">
                ₹{d.dealPrice.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-slate-400 line-through">
                ₹{d.normalPrice.toLocaleString("en-IN")}
              </span>
            </p>
            <p className="mt-1 text-xs font-medium text-purple-600">
              {t(lang, "shop_deal_limit_left")}: {d.remainingQty}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
