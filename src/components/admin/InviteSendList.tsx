"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Input } from "@/components/ui/Input";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";
import { buildWhatsAppLink } from "@/lib/waLink";
import { buildInviteMessage, type InviteLang } from "@/lib/inviteMessage";

export interface InviteRow {
  id: string;
  name: string;
  loginCode: string;
  password: string;
  whatsapp: string;
  phone: string;
  route: string;
  salesmen: string;
  loggedIn: boolean;
}

const SENT_KEY = "jp-invite-sent-v1";

const SENT_EVENT = "jp-invite-sent-change";

function readSentRaw(): string {
  try {
    return localStorage.getItem(SENT_KEY) ?? "{}";
  } catch {
    return "{}";
  }
}

function writeSentRaw(value: string | null) {
  try {
    if (value === null) localStorage.removeItem(SENT_KEY);
    else localStorage.setItem(SENT_KEY, value);
  } catch {
    // Marks are a convenience; sending must still work if storage is blocked.
  }
  window.dispatchEvent(new Event(SENT_EVENT));
}

function subscribeSent(onChange: () => void) {
  window.addEventListener(SENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function InviteSendList({ rows }: { rows: InviteRow[] }) {
  const [lang, setLang] = useState<InviteLang>("mr");
  const [query, setQuery] = useState("");
  const [route, setRoute] = useState("");
  const [salesman, setSalesman] = useState("");
  const [onlyNew, setOnlyNew] = useState(true);
  const [hideSent, setHideSent] = useState(false);
  // Sent marks live in this browser only; the server render has none.
  const sentRaw = useSyncExternalStore(subscribeSent, readSentRaw, () => "{}");
  const sent = useMemo<Record<string, string>>(() => {
    try {
      return JSON.parse(sentRaw) as Record<string, string>;
    } catch {
      return {};
    }
  }, [sentRaw]);

  const routes = useMemo(() => [...new Set(rows.map((r) => r.route))].sort(), [rows]);
  const salesmen = useMemo(
    () => [...new Set(rows.flatMap((r) => (r.salesmen ? r.salesmen.split(", ") : [])))].sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (onlyNew && r.loggedIn) return false;
      if (hideSent && sent[r.id]) return false;
      if (route && r.route !== route) return false;
      if (salesman && !r.salesmen.split(", ").includes(salesman)) return false;
      if (q && !`${r.name} ${r.phone} ${r.loginCode}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, onlyNew, hideSent, sent, route, salesman, query]);

  const sentInView = filtered.filter((r) => sent[r.id]).length;
  const nextUnsent = filtered.find((r) => !sent[r.id]);

  function linkFor(r: InviteRow): string {
    return buildWhatsAppLink(r.whatsapp, buildInviteMessage(lang, r));
  }

  function markSent(id: string) {
    writeSentRaw(JSON.stringify({ ...sent, [id]: new Date().toISOString() }));
  }

  function send(r: InviteRow) {
    window.open(linkFor(r), "_blank", "noopener,noreferrer");
    markSent(r.id);
  }

  function resetSent() {
    if (!window.confirm("Clear every 'Sent' mark in this browser?")) return;
    writeSentRaw(null);
  }

  const selectClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, phone or code..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <select className={selectClass} value={route} onChange={(e) => setRoute(e.target.value)}>
          <option value="">All routes</option>
          {routes.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select className={selectClass} value={salesman} onChange={(e) => setSalesman(e.target.value)}>
          <option value="">All salesmen</option>
          {salesmen.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className={selectClass} value={lang} onChange={(e) => setLang(e.target.value as InviteLang)}>
          <option value="mr">Message in Marathi</option>
          <option value="en">Message in English</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
          Only stores that never logged in
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hideSent} onChange={(e) => setHideSent(e.target.checked)} />
          Hide already sent
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
        <p className="text-sm text-slate-700">
          <span className="font-semibold tabular-nums">{filtered.length}</span> stores shown,{" "}
          <span className="font-semibold tabular-nums">{sentInView}</span> sent
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!nextUnsent}
            onClick={() => nextUnsent && send(nextUnsent)}
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {nextUnsent ? `Send next: ${nextUnsent.name}` : "All sent"}
          </button>
          <ExportExcelButton
            data={filtered.map((r) => ({
              Store: r.name,
              Route: r.route,
              Phone: r.phone,
              "Login ID": r.loginCode,
              Password: r.password,
              Message: buildInviteMessage(lang, r),
            }))}
            filename="whatsapp-invite-list"
          />
          <button
            type="button"
            onClick={resetSent}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-white"
          >
            Reset sent marks
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Store</th>
              <th className="py-2 pr-4">Route</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4">Login</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{r.name}</td>
                <td className="py-2 pr-4 text-slate-600">
                  {r.route}
                  {r.salesmen && <span className="block text-xs text-slate-400">{r.salesmen}</span>}
                </td>
                <td className="py-2 pr-4 tabular-nums text-slate-600">{r.phone}</td>
                <td className="py-2 pr-4 font-mono text-xs text-slate-600">
                  {r.loginCode} / {r.password}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => send(r)}
                    className={
                      sent[r.id]
                        ? "rounded-lg border border-green-600 px-2 py-1 text-xs font-semibold text-green-700"
                        : "rounded-lg bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
                    }
                  >
                    {sent[r.id] ? "Sent, resend" : "WhatsApp"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  No stores match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
