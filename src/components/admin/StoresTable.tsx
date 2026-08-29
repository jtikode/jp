"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { buildWhatsAppLink, buildVisitReminderMessage } from "@/lib/waLink";
import { storeLabel } from "@/lib/storeLabel";
import { shopActivityStatus } from "@/lib/shopActivity";

interface StoreRow {
  id: string;
  externalCode: string | null;
  name: string;
  address: string;
  phone: string | null;
  routeNames: string | null;
  shopActivated: boolean;
  lastLoginAt: string | null;
}

export function StoresTable({ stores }: { stores: StoreRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = stores.filter((s) =>
    `${s.name} ${s.address} ${s.externalCode ?? ""} ${s.routeNames ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search stores by name, address, code, or route..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Address</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4">Route(s)</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const activity = shopActivityStatus(s.shopActivated, s.lastLoginAt);
              return (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{storeLabel(s.name, s.externalCode)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${activity.className}`}>
                      {activity.label}
                    </span>
                  </div>
                </td>
                <td className="py-2 pr-4 text-slate-600">{s.address}</td>
                <td className="py-2 pr-4 text-slate-600">{s.phone ?? "—"}</td>
                <td className="py-2 pr-4 text-slate-600">{s.routeNames ?? "—"}</td>
                <td className="py-2 pr-4">
                  <div className="flex gap-2">
                    {s.phone && (
                      <a
                        href={buildWhatsAppLink(s.phone, buildVisitReminderMessage())}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        WhatsApp
                      </a>
                    )}
                    <Link
                      href={`/team/admin/outstanding/${s.id}`}
                      className="rounded-lg bg-amber-600 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                      Outstanding
                    </Link>
                  </div>
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  No stores match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
