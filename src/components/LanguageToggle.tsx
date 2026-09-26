"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLanguage } from "@/actions/languageActions";
import type { Lang } from "@/lib/i18n";

export function LanguageToggle({ initialLang, compact = false }: { initialLang: Lang; compact?: boolean }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(initialLang);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next: Lang = lang === "en" ? "mr" : "en";
    setLang(next);
    startTransition(async () => {
      await setLanguage(next);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`shrink-0 rounded-lg border-2 border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 ${
        compact ? "min-h-9 px-2 text-xs sm:min-h-11 sm:px-3 sm:text-sm" : "min-h-11 px-3 text-sm"
      }`}
    >
      {lang === "mr" ? "English" : "मराठी"}
    </button>
  );
}
