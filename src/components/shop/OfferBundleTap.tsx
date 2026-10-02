"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import { useCart, type BundleLine } from "@/components/shop/CartProvider";
import { t, type Lang } from "@/lib/i18n";

export interface OfferBundle {
  bannerId: string;
  title: string | null;
  lines: BundleLine[];
}

type Status = null | { kind: "added"; sets: number } | { kind: "conflict" };

// Wraps an offer banner image: tapping the image (or the button under it)
// drops the offer's products into the cart in one go. The caller only renders
// this for banners that actually have a bundle.
export function OfferBundleTap({
  bundle,
  lang,
  children,
}: {
  bundle: OfferBundle;
  lang: Lang;
  children: ReactNode;
}) {
  const { addBundle } = useCart();
  const [status, setStatus] = useState<Status>(null);

  function add() {
    const result = addBundle(bundle.bannerId, bundle.title, bundle.lines);
    setStatus(result.ok ? { kind: "added", sets: result.sets } : { kind: "conflict" });
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${t(lang, "shop_offer_add_to_cart")}: ${bundle.title ?? ""}`}
        onClick={add}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            add();
          }
        }}
        className="cursor-pointer"
      >
        {children}
      </div>

      <div className="mt-2 rounded-xl bg-blue-50 p-2.5">
        <p className="text-xs text-slate-600">
          <span className="font-semibold text-slate-800">{t(lang, "shop_offer_adds")}: </span>
          {bundle.lines
            .map(
              (l) =>
                `${l.name.replace(/\s+/g, " ")} × ${l.quantity}${l.freeQty > 0 ? ` (${l.freeQty} ${t(lang, "shop_free")})` : ""}`,
            )
            .join(" · ")}
        </p>
        <button
          type="button"
          onClick={add}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 active:bg-blue-900"
        >
          <ShoppingCart size={16} strokeWidth={2} />
          {t(lang, "shop_offer_add_to_cart")}
        </button>
        {status?.kind === "added" && (
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs font-semibold text-green-700" role="status">
            <Check size={14} strokeWidth={2.5} />
            {status.sets > 1 ? `${t(lang, "shop_offer_added_again")} (×${status.sets})` : t(lang, "shop_offer_added")}
            <Link href="/shop/checkout" className="text-blue-700 underline">
              {t(lang, "shop_view_cart")}
            </Link>
          </p>
        )}
        {status?.kind === "conflict" && (
          <p className="mt-2 text-xs font-semibold text-red-600" role="alert">
            {t(lang, "shop_offer_conflict")}
          </p>
        )}
      </div>
    </div>
  );
}
