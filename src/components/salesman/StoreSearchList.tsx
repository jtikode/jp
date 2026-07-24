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
        {filtered.map((store) => (
          <Link key={store.id} href={`/salesman/stores/${store.id}/visit`}>
            <Card className="transition-colors hover:bg-slate-50">
              <p className="font-semibold text-slate-900">{store.name}</p>
              <p className="text-sm text-slate-500">{store.address}</p>
              {store.routeName && (
                <p className="mt-1 text-xs font-medium text-blue-700">{store.routeName}</p>
              )}
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-slate-400">No stores match your search.</p>
        )}
      </div>
    </div>
  );
}
