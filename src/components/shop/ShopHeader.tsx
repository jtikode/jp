"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Crown } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ShopInstallButton } from "@/components/shop/ShopInstallButton";
import { t, type Lang } from "@/lib/i18n";

export function ShopHeader({ storeName, lang, gold = false }: { storeName: string; lang: Lang; gold?: boolean }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/shop/logout", { method: "POST" });
    router.push("/shop/login");
    router.refresh();
  }

  return (
    <header
      className={`flex items-center justify-between gap-2 px-3 py-2.5 shadow-sm sm:gap-3 sm:px-6 sm:py-3 ${
        gold ? "border-b-2 border-amber-400 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200" : "bg-white"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white sm:flex ${
            gold ? "bg-gradient-to-br from-amber-500 to-yellow-600" : "bg-blue-700"
          }`}
        >
          {gold ? <Crown size={22} strokeWidth={2} /> : storeName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          {gold ? (
            <p className="flex items-center gap-1 text-[10px] font-extrabold leading-tight tracking-wide text-amber-800 sm:text-xs">
              <Crown size={12} strokeWidth={2.25} className="sm:hidden" />
              {t(lang, "shop_gold_badge")}
            </p>
          ) : (
            <p className="text-[10px] leading-tight text-slate-500 sm:text-xs">{t(lang, "shop_welcome_to")}</p>
          )}
          {/* Wraps to two lines and shrinks on phones — the four buttons on
              the right leave very little width, and a long medical-store name
              used to be squeezed down to nothing. */}
          <p className="line-clamp-2 text-sm font-bold leading-tight text-slate-900 sm:text-lg">{storeName}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <ShopInstallButton lang={lang} />
        <Link
          href="/shop/orders"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 sm:h-11 sm:w-11"
          aria-label={t(lang, "shop_orders_nav")}
          title={t(lang, "shop_orders_nav")}
        >
          <Bell size={20} strokeWidth={1.75} />
        </Link>
        <LanguageToggle initialLang={lang} compact />
        <button
          onClick={handleLogout}
          className="flex h-9 items-center justify-center rounded-full bg-slate-100 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 sm:h-11 sm:px-3"
          aria-label={t(lang, "log_out")}
          title={t(lang, "log_out")}
        >
          {t(lang, "log_out")}
        </button>
      </div>
    </header>
  );
}
