"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";
import { buildWhatsAppLink } from "@/lib/waLink";

interface CredentialRow {
  id: string;
  name: string;
  loginCode: string;
  password: string;
  phone: string | null;
  lastLoginAt: string | null;
}

export function ShopLoginCredentialsTable({ stores }: { stores: CredentialRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = stores.filter((s) =>
    `${s.name} ${s.loginCode}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Search by name or login code..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <ExportExcelButton
          data={stores.map((s) => ({
            Name: s.name,
            "Login Code": s.loginCode,
            Password: s.password,
          }))}
          filename="shop-login-credentials"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Login Code</th>
              <th className="py-2 pr-4">Password</th>
              <th className="py-2 pr-4">Last Login</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{s.name}</td>
                <td className="py-2 pr-4 font-mono font-semibold text-blue-700">{s.loginCode}</td>
                <td className="py-2 pr-4 font-mono font-semibold text-slate-700">{s.password}</td>
                <td className="py-2 pr-4 text-slate-500">
                  {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString("en-IN") : "Never"}
                </td>
                <td className="py-2 pr-4">
                  {s.phone && (
                    <a
                      href={buildWhatsAppLink(
                        s.phone,
                        `Your J P Traders shop login — Login ID: ${s.loginCode}, Password: ${s.password}`,
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
