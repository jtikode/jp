"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

const SHOW_AFTER_MS = 10_000;
// Once shown, stay quiet on this device for a while so a retailer who opens
// the app several times a day isn't hit with the same full-screen ad each time.
const QUIET_PERIOD_MS = 6 * 60 * 60 * 1000;
const STORAGE_KEY = "jpt_offer_popup_shown_at";

const OFFER = {
  image: "/banners/offer-bonanza-mankind.jpg",
  alt: "Mankind and J P Traders special scheme",
  href: "/shop/products?company=PRIME%20MANKIND",
};

function alreadyShownRecently(): boolean {
  try {
    const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    return Date.now() - last < QUIET_PERIOD_MS;
  } catch {
    return false;
  }
}

function markShown() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Storage blocked: the popup just won't be rate-limited across visits.
  }
}

/** Full-screen Mankind scheme ad, 10 seconds after the shop opens. Tapping it opens the Mankind product list. */
export function OfferPopup({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (alreadyShownRecently()) return;

    let timer: ReturnType<typeof setTimeout>;
    function tryShow() {
      // Never cover the checkout screen mid-order; try again shortly.
      if (pathnameRef.current.startsWith("/shop/checkout")) {
        timer = setTimeout(tryShow, SHOW_AFTER_MS);
        return;
      }
      markShown();
      setOpen(true);
    }
    timer = setTimeout(tryShow, SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={OFFER.alt}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-black/85 p-3"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={() => setOpen(false)}
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg"
        aria-label={t(lang, "close")}
      >
        <X size={22} strokeWidth={2.5} />
      </button>
      <Link href={OFFER.href} onClick={() => setOpen(false)} className="flex min-h-0 flex-1 items-center justify-center">
        <Image
          src={OFFER.image}
          alt={OFFER.alt}
          width={912}
          height={1172}
          unoptimized
          priority
          className="max-h-full w-auto max-w-full rounded-xl object-contain"
        />
      </Link>
      <Link
        href={OFFER.href}
        onClick={() => setOpen(false)}
        className="w-full max-w-sm rounded-xl bg-orange-500 px-6 py-3.5 text-center text-base font-bold text-white shadow-lg hover:bg-orange-600"
      >
        {t(lang, "shop_offer_popup_cta")}
      </Link>
    </div>
  );
}
