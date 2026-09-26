"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ShopInstallButton } from "@/components/shop/ShopInstallButton";
import { t, type Lang } from "@/lib/i18n";

export function ShopHeader({ storeName, lang }: { storeName: string; lang: Lang }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/shop/logout", { method: "POST" });
    router.push("/shop/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between gap-2 bg-white px-3 py-2.5 shadow-sm sm:gap-3 sm:px-6 sm:py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white sm:flex">
          {storeName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] leading-tight text-slate-500 sm:text-xs">{t(lang, "shop_welcome_to")}</p>
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
