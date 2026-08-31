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
    <header className="flex items-center justify-between gap-3 bg-white px-4 py-3 shadow-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white">
          {storeName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{t(lang, "shop_welcome_to")}</p>
          <p className="truncate text-lg font-bold text-slate-900">{storeName}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ShopInstallButton lang={lang} />
        <Link
          href="/shop/orders"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
          aria-label={t(lang, "shop_orders_nav")}
          title={t(lang, "shop_orders_nav")}
        >
          <Bell size={20} strokeWidth={1.75} />
        </Link>
        <LanguageToggle initialLang={lang} />
        <button
          onClick={handleLogout}
          className="flex h-11 items-center justify-center rounded-full bg-slate-100 px-3 text-xs font-bold text-slate-700 hover:bg-slate-200"
          aria-label={t(lang, "log_out")}
          title={t(lang, "log_out")}
        >
          {t(lang, "log_out")}
        </button>
      </div>
    </header>
  );
}
