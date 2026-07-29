"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import type { Lang } from "@/lib/i18n";

interface AppHeaderProps {
  title: string;
  name: string;
  lang: Lang;
  logOutLabel?: string;
  extra?: ReactNode;
}

export function AppHeader({ title, name, lang, logOutLabel = "Log out", extra }: AppHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div>
        <p className="text-lg font-bold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{name}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {extra}
        <LanguageToggle initialLang={lang} />
        <button
          onClick={handleLogout}
          className="min-h-11 rounded-lg border-2 border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {logOutLabel}
        </button>
      </div>
    </header>
  );
}
