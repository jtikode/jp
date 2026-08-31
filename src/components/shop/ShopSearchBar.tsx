"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

export function ShopSearchBar({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    router.push(`/shop/products${params}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 rounded-2xl border-2 border-indigo-100 bg-indigo-50 p-1.5 pr-4"
    >
      <button
        type="submit"
        aria-label={t(lang, "shop_search_nav")}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white"
      >
        <Search size={18} strokeWidth={2} />
      </button>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t(lang, "shop_search_products")}
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
      />
    </form>
  );
}
