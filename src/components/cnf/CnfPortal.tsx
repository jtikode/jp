"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Minus, Plus, Search, ShoppingCart, X } from "lucide-react";
import type { CnfProduct } from "@/lib/cnf/catalog";
import { CNF_GROUPS, CNF_MIN_ORDER_VALUE } from "@/lib/cnf/config";
import { placeCnfOrder } from "@/actions/cnfActions";
import { OrderPlacedScreen } from "@/components/shop/OrderPlacedScreen";

interface Props {
  products: CnfProduct[];
  storeId: string;
  storeName: string;
  /** "" on cnf.jpkop.in, "/cnf" on app.jpkop.in. */
  base: string;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const draftKey = (storeId: string) => `cnf-cart:${storeId}`;
const EMPTY_CART: Record<string, number> = {};

function subscribe(): () => void {
  return () => {};
}

function loadDraft(key: string): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveDraft(key: string, cart: Record<string, number>) {
  try {
    window.localStorage.setItem(key, JSON.stringify(cart));
  } catch {
    // Private mode or blocked storage: the cart just won't survive a reload.
  }
}

function Stepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={`Less ${label}`}
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-30"
      >
        <Minus size={16} />
      </button>
      <input
        aria-label={`Quantity of ${label}`}
        inputMode="numeric"
        value={value === 0 ? "" : String(value)}
        placeholder="0"
        onChange={(e) => {
          const n = Number.parseInt(e.target.value.replace(/\D/g, ""), 10);
          onChange(Number.isFinite(n) ? Math.min(n, 100000) : 0);
        }}
        className="h-10 w-16 rounded-lg border border-slate-300 bg-white text-center text-base font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
      />
      <button
        type="button"
        aria-label={`More ${label}`}
        onClick={() => onChange(value + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function stockNote(stock: number | null): { text: string; className: string } {
  if (stock == null) return { text: "Stock on request", className: "text-slate-500" };
  if (stock <= 0) return { text: "Out of stock: ships when available", className: "text-amber-700" };
  if (stock < 10) return { text: `Only ${stock} left`, className: "text-amber-700" };
  return { text: "In stock", className: "text-green-700" };
}

export function CnfPortal({ products, storeId, storeName, base }: Props) {
  const router = useRouter();
  const key = draftKey(storeId);
  // The saved draft is read only after hydration so the server and first client render agree.
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const saved = useMemo(() => (hydrated ? loadDraft(key) : EMPTY_CART), [hydrated, key]);
  const [edited, setEdited] = useState<Record<string, number> | null>(null);
  const cart = edited ?? saved;
  const [group, setGroup] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const requestId = useRef<string | null>(null);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => (group === "all" || p.group === group) && (!q || p.name.toLowerCase().includes(q)));
  }, [products, group, query]);

  // Drafts can hold items that have since left the catalogue; they never count.
  const lines = useMemo(
    () =>
      Object.entries(cart)
        .filter(([id, qty]) => qty > 0 && byId.has(id))
        .map(([id, qty]) => ({ product: byId.get(id)!, qty })),
    [cart, byId],
  );
  const total = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const units = lines.reduce((sum, l) => sum + l.qty, 0);
  const belowMinimum = CNF_MIN_ORDER_VALUE > 0 && total < CNF_MIN_ORDER_VALUE;

  function setQty(id: string, qty: number) {
    setEdited((prev) => {
      const next = { ...(prev ?? saved) };
      if (qty > 0) next[id] = qty;
      else delete next[id];
      saveDraft(key, next);
      return next;
    });
    requestId.current = null;
  }

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      requestId.current ??= crypto.randomUUID();
      const res = await placeCnfOrder({
        lines: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
        notes: notes.trim() || undefined,
        clientRequestId: requestId.current,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not place the order.");
        return;
      }
      setPlaced(true);
    } catch {
      setError("Network problem. Your cart is saved: please try again.");
    } finally {
      setBusy(false);
    }
  }

  function finishOrder(viewOrders: boolean) {
    setEdited({});
    saveDraft(key, {});
    setNotes("");
    setOpen(false);
    setPlaced(false);
    requestId.current = null;
    if (viewOrders) router.push(`${base}/orders`);
  }

  async function signOut() {
    await fetch("/api/shop/logout", { method: "POST" });
    router.push(`${base}/login`);
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-slate-100 pb-28">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900">Distributor Orders</h1>
            <p className="truncate text-xs text-slate-500">{storeName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a href={`${base}/orders`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
              My orders
            </a>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="h-11 w-full rounded-xl border-2 border-slate-300 pl-9 pr-3 text-base focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {[{ slug: "all", label: "All" }, ...CNF_GROUPS].map((g) => (
              <button
                key={g.slug}
                type="button"
                onClick={() => setGroup(g.slug)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  group === g.slug ? "bg-blue-700 text-white" : "border border-slate-300 bg-white text-slate-700"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-2 px-4 pt-4">
        {visible.map((p) => {
          const note = stockNote(p.stock);
          return (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="min-w-0">
                <p className="font-semibold leading-snug text-slate-900">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {[CNF_GROUPS.find((g) => g.slug === p.group)?.label, p.unit, p.mrp ? `MRP ${inr(p.mrp)}` : null].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {inr(p.price)}
                  <span className={`ml-2 text-xs font-medium ${note.className}`}>{note.text}</span>
                </p>
              </div>
              <Stepper value={cart[p.id] ?? 0} onChange={(n) => setQty(p.id, n)} label={p.name} />
            </div>
          );
        })}
        {visible.length === 0 && <p className="py-10 text-center text-slate-500">No products found.</p>}
      </main>

      {lines.length > 0 && !open && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">
                {lines.length} item{lines.length === 1 ? "" : "s"} · {units} unit{units === 1 ? "" : "s"}
              </p>
              <p className="text-lg font-bold text-slate-900">{inr(total)}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 text-base font-semibold text-white"
            >
              <ShoppingCart size={18} /> Review order
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="Review order">
          <div className="flex max-h-[90dvh] w-full flex-col rounded-t-2xl bg-white sm:max-w-lg sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-bold text-slate-900">Your order</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600">
                <X size={18} />
              </button>
            </div>
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto px-4">
              {lines.map((l) => (
                <li key={l.product.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{l.product.name}</p>
                    <p className="text-xs text-slate-500">
                      {inr(l.product.price)} × {l.qty} = <span className="font-semibold text-slate-800">{inr(l.product.price * l.qty)}</span>
                    </p>
                  </div>
                  <Stepper value={l.qty} onChange={(n) => setQty(l.product.id, n)} label={l.product.name} />
                </li>
              ))}
              {lines.length === 0 && <li className="py-8 text-center text-slate-500">Your cart is empty.</li>}
            </ul>
            <div className="space-y-3 border-t border-slate-200 p-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Note for J P Traders (optional)"
                className="w-full rounded-xl border-2 border-slate-300 p-3 text-base focus:border-blue-600 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Total</span>
                <span className="text-xl font-bold text-slate-900">{inr(total)}</span>
              </div>
              {belowMinimum && (
                <p className="text-sm font-medium text-amber-700">
                  The minimum order is {inr(CNF_MIN_ORDER_VALUE)}. Add {inr(CNF_MIN_ORDER_VALUE - total)} more to place it.
                </p>
              )}
              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              <button
                type="button"
                onClick={submit}
                disabled={busy || lines.length === 0 || belowMinimum}
                className="min-h-12 w-full rounded-xl bg-green-700 text-base font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Placing order..." : "Place order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {placed && <OrderPlacedScreen lang="en" onClose={() => finishOrder(false)} onViewOrder={() => finishOrder(true)} />}
    </div>
  );
}
