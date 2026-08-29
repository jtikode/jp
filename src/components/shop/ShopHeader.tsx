"use client";

import Link from "next/link";
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
    <header className="flex flex-wrap items-center justify-between gap-2 bg-blue-700 px-4 py-3 shadow-sm sm:px-6">
      <div>
        <p className="text-lg font-bold text-white">MedPoint Shop</p>
        <p className="text-sm text-blue-100">{storeName}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/shop/quick-check"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border-2 border-blue-400 bg-blue-800 text-lg text-white hover:bg-blue-900"
          aria-label="Quick Check"
          title="Quick Check"
        >
          🔍
        </Link>
        <LanguageToggle initialLang={lang} />
        <button
          onClick={handleLogout}
          className="min-h-11 rounded-lg border-2 border-blue-400 bg-blue-800 px-4 text-sm font-semibold text-white hover:bg-blue-900"
        >
          {t(lang, "log_out")}
        </button>
      </div>
    </header>
  );
}
