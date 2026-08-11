"use client";

import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { t, type Lang } from "@/lib/i18n";

export function ShopHeader({ storeName, lang }: { storeName: string; lang: Lang }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/shop/logout", { method: "POST" });
    router.push("/shop/login");
    router.refresh();
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div>
        <p className="text-lg font-bold text-slate-900">Shop</p>
        <p className="text-sm text-slate-500">{storeName}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LanguageToggle initialLang={lang} />
        <button
          onClick={handleLogout}
          className="min-h-11 rounded-lg border-2 border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {t(lang, "log_out")}
        </button>
      </div>
    </header>
  );
}
