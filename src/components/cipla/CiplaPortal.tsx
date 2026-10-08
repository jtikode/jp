"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Gift, LogOut, Minus, Plus, Search, ShoppingCart, Sparkles, Tag, X } from "lucide-react";
import { evaluateCart, inr, lineKey } from "@/lib/ciplaOtc/engine";
import type { CartLine, OtcBrand, OtcSheet, OtcSku } from "@/lib/ciplaOtc/types";
import { placeCiplaOtcOrder, searchCiplaStores, type CiplaStoreOption } from "@/actions/ciplaOtcActions";
import { OrderPlacedScreen } from "@/components/shop/OrderPlacedScreen";

interface Props {
  sheet: OtcSheet;
  identity: { kind: "retailer" | "staff"; name: string };
  /** "" on cipla.jpkop.in, "/cipla" on app.jpkop.in. */
  base: string;
}

const draftKey = (sheetId: string, who: string) => `cipla-otc-cart:${sheetId}:${who}`;

function loadDraft(key: string): Record<string, CartLine> {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, CartLine>) : {};
  } catch {
    return {};
  }
}

function saveDraft(key: string, cart: Record<string, CartLine>) {
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
        className="h-10 w-14 rounded-lg border border-slate-300 bg-white text-center text-base font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
      />
      <button
        type="button"
        aria-label={`More ${label}`}
        onClick={() => onChange(value + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function SkuRows({
  sku,
  qtyOf,
  setQty,
}: {
  sku: OtcSku;
  qtyOf: (l: { skuId: string; priceIdx: number; option?: string }) => number;
  setQty: (l: { skuId: string; priceIdx: number; option?: string }, n: number) => void;
}) {
  const options = sku.options && sku.options.length > 0 ? sku.options : [undefined];
  return (
    <div className="border-t border-slate-100 py-3">
      <p className="text-sm font-semibold text-slate-900">{sku.name}</p>
      {sku.note && <p className="text-xs text-slate-500">{sku.note}</p>}
      <div className="mt-2 space-y-2">
        {sku.prices.flatMap((price, priceIdx) =>
          options.map((option) => {
            const ref = { skuId: sku.id, priceIdx, option };
            const rate = price.net ?? price.ptr;
            return (
              <div key={lineKey(ref)} className="flex items-center justify-between gap-3">
                <div className="min-w-0 text-sm text-slate-600">
                  <span className="text-slate-400 line-through decoration-slate-300">MRP {price.mrpText ?? price.mrp}</span>
                  {option && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">{option}</span>}
                  <div className="font-semibold text-slate-900">
                    {inr(rate)}
                    {price.net != null && price.net !== price.ptr && (
                      <span className="ml-1.5 text-xs font-normal text-slate-400">PTR {inr(price.ptr)}</span>
                    )}
                  </div>
                </div>
                <Stepper value={qtyOf(ref)} onChange={(n) => setQty(ref, n)} label={sku.name} />
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

function BrandCard({
  brand,
  open,
  onToggle,
  qtyOf,
  setQty,
  appliedHere,
  hintsHere,
  inCart,
  filter,
}: {
  brand: OtcBrand;
  open: boolean;
  onToggle: () => void;
  qtyOf: (l: { skuId: string; priceIdx: number; option?: string }) => number;
  setQty: (l: { skuId: string; priceIdx: number; option?: string }, n: number) => void;
  appliedHere: string[];
  hintsHere: string[];
  inCart: number;
  filter: string;
}) {
  const skus = filter ? brand.skus.filter((s) => s.name.toLowerCase().includes(filter) || brand.title.toLowerCase().includes(filter)) : brand.skus;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">{brand.title}</h2>
            {brand.tag && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">{brand.tag}</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {brand.skus.length} item{brand.skus.length === 1 ? "" : "s"}
            {brand.rules.some((r) => r.kind !== "note") && " · schemes available"}
          </p>
        </div>
        {inCart > 0 && (
          <span className="rounded-full bg-blue-700 px-2.5 py-1 text-xs font-bold text-white">{inCart} in cart</span>
        )}
        <ChevronDown size={20} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-3">
          {brand.rules.length > 0 && (
            <div className="mb-2 space-y-1.5 rounded-xl bg-amber-50 p-3">
              {brand.rules.map((r, i) => (
                <p key={i} className="flex gap-2 text-xs leading-relaxed text-amber-900">
                  <Tag size={13} className="mt-0.5 shrink-0" />
                  <span>{r.text}</span>
                </p>
              ))}
            </div>
          )}
          {appliedHere.length > 0 && (
            <div className="mb-2 space-y-1 rounded-xl bg-green-50 p-3">
              {appliedHere.map((a, i) => (
                <p key={i} className="flex gap-2 text-xs font-semibold text-green-800">
                  <Sparkles size={13} className="mt-0.5 shrink-0" />
                  <span>{a}</span>
                </p>
              ))}
            </div>
          )}
          {hintsHere.length > 0 && (
            <div className="mb-2 space-y-1 rounded-xl bg-blue-50 p-3">
              {hintsHere.map((h, i) => (
                <p key={i} className="text-xs font-medium text-blue-800">
                  {h}
                </p>
              ))}
            </div>
          )}
          {skus.map((sku) => (
            <SkuRows key={sku.id} sku={sku} qtyOf={qtyOf} setQty={setQty} />
          ))}
        </div>
      )}
    </section>
  );
}

export function CiplaPortal({ sheet, identity, base }: Props) {
  const router = useRouter();
  const storageKey = draftKey(sheet.id, `${identity.kind}:${identity.name}`);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [openBrands, setOpenBrands] = useState<Set<string>>(new Set());
  const [cartOpen, setCartOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [store, setStore] = useState<CiplaStoreOption | null>(null);
  const [storeQuery, setStoreQuery] = useState("");
  const [storeResults, setStoreResults] = useState<CiplaStoreOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const requestId = useRef<string | null>(null);

  // Restore the unsent cart after mount (not during render, to stay SSR-safe).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of browser storage
    setCart(loadDraft(storageKey));
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (ready) saveDraft(storageKey, cart);
  }, [cart, ready, storageKey]);

  useEffect(() => {
    if (identity.kind !== "staff" || store) return;
    const q = storeQuery.trim();
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale results when the box is emptied
      setStoreResults([]);
      return;
    }
    let live = true;
    const timer = setTimeout(() => {
      searchCiplaStores(q).then((r) => {
        if (live) setStoreResults(r);
      });
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [storeQuery, identity.kind, store]);

  const cartLines = useMemo(() => Object.values(cart).filter((l) => l.qty > 0), [cart]);
  const result = useMemo(() => evaluateCart(sheet, cartLines), [sheet, cartLines]);

  const qtyOf = (l: { skuId: string; priceIdx: number; option?: string }) => cart[lineKey(l)]?.qty ?? 0;
  const setQty = (l: { skuId: string; priceIdx: number; option?: string }, n: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const key = lineKey(l);
      if (n <= 0) delete next[key];
      else next[key] = { skuId: l.skuId, priceIdx: l.priceIdx, option: l.option, qty: n };
      return next;
    });
  };

  const filter = search.trim().toLowerCase();
  const visibleBrands = useMemo(
    () =>
      filter
        ? sheet.brands.filter((b) => b.title.toLowerCase().includes(filter) || b.skus.some((s) => s.name.toLowerCase().includes(filter)))
        : sheet.brands,
    [sheet, filter],
  );

  const perBrand = useMemo(() => {
    const units = new Map<string, number>();
    for (const l of result.lines) units.set(l.brandId, (units.get(l.brandId) ?? 0) + 1);
    return units;
  }, [result]);

  const totalUnits = result.lines.reduce((s, l) => s + l.qty, 0);

  async function logout() {
    await fetch(identity.kind === "retailer" ? "/api/shop/logout" : "/api/auth/logout", { method: "POST" });
    router.push(`${base}/login`);
    router.refresh();
  }

  async function submit() {
    setError(null);
    if (identity.kind === "staff" && !store) {
      setError("Pick the retailer this order is for.");
      return;
    }
    setBusy(true);
    try {
      requestId.current ??= crypto.randomUUID();
      const res = await placeCiplaOtcOrder({
        lines: cartLines,
        storeId: store?.id,
        notes: notes.trim() || undefined,
        clientRequestId: requestId.current,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not place the order.");
        return;
      }
      setPlaced(true);
    } catch {
      setError("Network problem. Check your connection and tap Place order again; it will not be duplicated.");
    } finally {
      setBusy(false);
    }
  }

  function finishOrder(goToOrders: boolean) {
    setCart({});
    setNotes("");
    setStore(null);
    setStoreQuery("");
    setCartOpen(false);
    setPlaced(false);
    requestId.current = null;
    if (goToOrders) router.push(`${base}/orders`);
  }

  return (
    <div className="min-h-dvh bg-slate-100 pb-28">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-slate-900">Cipla OTC Booking</h1>
            <p className="truncate text-xs text-slate-500">
              {sheet.label} rates · {identity.name}
            </p>
          </div>
          <a href={`${base}/orders`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
            My orders
          </a>
          <button type="button" aria-label="Sign out" onClick={logout} className="rounded-lg border border-slate-300 p-2.5 text-slate-600">
            <LogOut size={18} />
          </button>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand or item, e.g. Omnigel"
              style={{ paddingLeft: 40 }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pr-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 pt-4">
        <p className="rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">{sheet.banner} Schemes and quantity incentives are worked out automatically as you add items.</p>
        {visibleBrands.map((brand) => {
          const appliedHere = result.applied.filter((a) => a.brandId === brand.id).map((a) => (a.amount ? `${a.label}: ${inr(a.amount)} saved` : a.label));
          const hintsHere = result.hints.filter((h) => h.brandId === brand.id).map((h) => h.text);
          return (
            <BrandCard
              key={brand.id}
              brand={brand}
              open={!!filter || openBrands.has(brand.id)}
              onToggle={() =>
                setOpenBrands((prev) => {
                  const next = new Set(prev);
                  if (next.has(brand.id)) next.delete(brand.id);
                  else next.add(brand.id);
                  return next;
                })
              }
              qtyOf={qtyOf}
              setQty={setQty}
              appliedHere={appliedHere}
              hintsHere={hintsHere}
              inCart={perBrand.get(brand.id) ?? 0}
              filter={filter}
            />
          );
        })}
        {visibleBrands.length === 0 && <p className="py-10 text-center text-slate-500">Nothing matches &ldquo;{search}&rdquo;.</p>}
      </main>

      {cartLines.length > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-xl bg-blue-700 px-4 py-3 text-white"
          >
            <span className="flex items-center gap-2 font-semibold">
              <ShoppingCart size={20} />
              {totalUnits} unit{totalUnits === 1 ? "" : "s"}
              {result.discountTotal > 0 && <span className="rounded bg-green-500 px-1.5 py-0.5 text-xs">saving {inr(result.discountTotal)}</span>}
            </span>
            <span className="text-lg font-bold">{inr(result.total)}</span>
          </button>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/50" role="dialog" aria-modal="true" aria-label="Your Cipla OTC cart">
          <div className="mx-auto flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-3xl bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">Your order</h2>
              <button type="button" aria-label="Close cart" onClick={() => setCartOpen(false)} className="rounded-lg p-2 text-slate-500">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {identity.kind === "staff" && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Retailer</label>
                  {store ? (
                    <div className="flex items-center justify-between rounded-xl border-2 border-green-300 bg-green-50 p-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{store.name}</p>
                        <p className="truncate text-xs text-slate-600">{store.address}</p>
                      </div>
                      <button type="button" onClick={() => setStore(null)} className="ml-2 text-sm font-semibold text-blue-700">
                        Change
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        value={storeQuery}
                        onChange={(e) => setStoreQuery(e.target.value)}
                        placeholder="Type retailer name, code or phone"
                        className="h-12 w-full rounded-xl border-2 border-slate-300 px-3 text-base focus:border-blue-600 focus:outline-none"
                      />
                      {storeResults.length > 0 && (
                        <ul className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                          {storeResults.map((s) => (
                            <li key={s.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setStore(s);
                                  setStoreResults([]);
                                }}
                                className="w-full border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-slate-50"
                              >
                                <span className="block text-sm font-semibold text-slate-900">{s.name}</span>
                                <span className="block truncate text-xs text-slate-500">
                                  {s.code ? `${s.code} · ` : ""}
                                  {s.address}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              <ul className="divide-y divide-slate-100">
                {result.lines.map((l) => (
                  <li key={l.key} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{l.name}</p>
                        <p className="text-xs text-slate-500">
                          {inr(l.unit)} × {l.qty}
                          {l.freeQty > 0 && <span className="ml-1 font-semibold text-green-700">+ {l.freeQty} free</span>}
                        </p>
                        {l.discount > 0 && <p className="text-xs font-semibold text-green-700">Scheme −{inr(l.discount)}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{inr(l.lineTotal)}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Stepper
                        value={l.qty}
                        onChange={(n) => setQty({ skuId: l.skuId, priceIdx: l.priceIdx, option: l.option }, n)}
                        label={l.name}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              {(result.freeLines.length > 0 || result.gifts.length > 0) && (
                <div className="space-y-1.5 rounded-xl bg-green-50 p-3">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-green-800">
                    <Gift size={16} /> Free with this order
                  </p>
                  {result.freeLines.map((f, i) => (
                    <p key={i} className="text-sm text-green-900">
                      {f.qty} × {f.name}
                    </p>
                  ))}
                  {result.gifts.map((g, i) => (
                    <p key={`g${i}`} className="text-sm text-green-900">
                      {g.text}
                    </p>
                  ))}
                </div>
              )}

              {result.hints.length > 0 && (
                <div className="space-y-1 rounded-xl bg-blue-50 p-3">
                  <p className="text-sm font-bold text-blue-800">Add a little more to unlock</p>
                  {result.hints.map((h, i) => (
                    <p key={i} className="text-xs text-blue-900">
                      {h.text}
                    </p>
                  ))}
                </div>
              )}

              <div>
                <label htmlFor="otc-notes" className="mb-1 block text-sm font-semibold text-slate-700">
                  Note for billing (optional)
                </label>
                <textarea
                  id="otc-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="w-full rounded-xl border-2 border-slate-300 p-3 text-base focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-200 px-5 py-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Items total</span>
                <span>{inr(result.subtotal)}</span>
              </div>
              {result.discountTotal > 0 && (
                <div className="flex justify-between text-sm font-semibold text-green-700">
                  <span>Scheme discount</span>
                  <span>−{inr(result.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Payable</span>
                <span>{inr(result.total)}</span>
              </div>
              <p className="text-xs text-slate-500">Rates are Net PTR including GST, as on the {sheet.label} sheet. Final invoice is raised by billing.</p>
              {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
              <button
                type="button"
                onClick={submit}
                disabled={busy || cartLines.length === 0}
                className="min-h-14 w-full rounded-xl bg-blue-700 text-lg font-semibold text-white disabled:opacity-50"
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
