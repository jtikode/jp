"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface StoreItem {
  id: string;
  name: string;
  address: string;
  routeName?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export function StoreSearchList({ stores }: { stores: StoreItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = stores.filter((s) =>
    `${s.name} ${s.address}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Search stores by name or address..."
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
                    {store.name}
                    {located && (
                      <span title="Location already marked" aria-label="Location already marked">
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
                    Map
                  </a>
                )}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-slate-400">No stores match your search.</p>
        )}
      </div>
    </div>
  );
}
