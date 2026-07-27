"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { storeLabel } from "@/lib/storeLabel";
import { t, type Lang } from "@/lib/i18n";

interface StoreItem {
  id: string;
  name: string;
  externalCode?: string | null;
  address: string;
  routeName?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export function StoreSearchList({ lang, stores }: { lang: Lang; stores: StoreItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = stores.filter((s) =>
    `${s.name} ${s.address} ${s.externalCode ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder={t(lang, "search_stores_placeholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        {filtered.map((store) => {
          const located = store.latitude != null && store.longitude != null;
          return (
            <Card key={store.id} className="transition-colors hover:bg-slate-50">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/salesman/stores/${store.id}/visit`} className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                    {storeLabel(store.name, store.externalCode)}
                    {located && (
                      <span title={t(lang, "location_marked")} aria-label={t(lang, "location_marked")}>
                        📍
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">{store.address}</p>
                  {store.routeName && (
                    <p className="mt-1 text-xs font-medium text-blue-700">{store.routeName}</p>
                  )}
                </Link>
                {located && (
                  <a
                    href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-semibold text-blue-700 hover:underline"
                  >
                    {t(lang, "map")}
                  </a>
                )}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-slate-400">{t(lang, "no_stores_match")}</p>
        )}
      </div>
    </div>
  );
}
