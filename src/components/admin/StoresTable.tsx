"use client";

import { useState } from "react";
import { addDays, format } from "date-fns";
import { Input } from "@/components/ui/Input";
import { buildWhatsAppLink } from "@/lib/waLink";

interface StoreRow {
  id: string;
  externalCode: string | null;
  name: string;
  address: string;
  phone: string | null;
  routeName: string | null;
}

export function StoresTable({ stores }: { stores: StoreRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = stores.filter((s) =>
    `${s.name} ${s.address} ${s.externalCode ?? ""} ${s.routeName ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const tomorrow = format(addDays(new Date(), 1), "d MMM yyyy");

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
              <th className="py-2 pr-4">Code</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Address</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4">Route</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-slate-600">{s.externalCode ?? "—"}</td>
                <td className="py-2 pr-4 font-medium text-slate-900">{s.name}</td>
                <td className="py-2 pr-4 text-slate-600">{s.address}</td>
                <td className="py-2 pr-4 text-slate-600">{s.phone ?? "—"}</td>
                <td className="py-2 pr-4 text-slate-600">{s.routeName ?? "—"}</td>
                <td className="py-2 pr-4">
                  {s.phone && (
                    <a
                      href={buildWhatsAppLink(
                        s.phone,
                        `Hello, this is J.P. Traders. We will be visiting ${s.name} tomorrow (${tomorrow}). Please keep your requirements ready.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      WhatsApp
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
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
