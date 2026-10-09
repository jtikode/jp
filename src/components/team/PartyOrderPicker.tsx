"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { searchPartiesForOrder, startOrderingForParty, type OrderPartyOption } from "@/actions/staffOrderActions";
import { Card } from "@/components/ui/Card";

export function PartyOrderPicker() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrderPartyOption[]>([]);
  const [searched, setSearched] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale results when the box is emptied
      setResults([]);
      setSearched(false);
      return;
    }
    let live = true;
    const timer = setTimeout(() => {
      searchPartiesForOrder(q)
        .then((r) => {
          if (live) {
            setResults(r);
            setSearched(true);
          }
        })
        .catch(() => {
          if (live) setError("Could not search. Please try again.");
        });
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query]);

  async function open(id: string) {
    setError(null);
    setOpeningId(id);
    try {
      const res = await startOrderingForParty(id);
      if (!res.ok) {
        setError(res.error ?? "Could not open the shop for this party.");
        return;
      }
      // A fresh cart for each party: the shop keeps its cart per device.
      try {
        localStorage.removeItem("jpt_shop_cart");
      } catch {
        // Blocked storage: carry on with whatever cart is there.
      }
      router.push("/shop/home");
    } catch {
      setError("Could not open the shop for this party.");
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <Card>
      <label htmlFor="party-search" className="mb-1 block text-sm font-semibold text-slate-700">
        Party name
      </label>
      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="party-search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type medical store name, code or phone"
          style={{ paddingLeft: 44 }}
          className="min-h-14 w-full rounded-xl border-2 border-slate-300 pr-4 text-lg text-slate-900 focus:border-blue-600 focus:outline-none"
        />
      </div>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      <ul className="mt-3 divide-y divide-slate-100">
        {results.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => open(s.id)}
              disabled={openingId !== null}
              className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-slate-50 disabled:opacity-60"
            >
              <span className="min-w-0">
                <span className="block font-semibold text-slate-900">{s.name}</span>
                <span className="block truncate text-xs text-slate-500">
                  {[s.code, s.routeName, s.address].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="shrink-0 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white">
                {openingId === s.id ? "Opening..." : "Order"}
              </span>
            </button>
          </li>
        ))}
        {searched && results.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-500">No party matches &ldquo;{query.trim()}&rdquo;.</li>
        )}
      </ul>
    </Card>
  );
}
