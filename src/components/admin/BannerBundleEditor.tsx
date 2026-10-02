"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { searchBannerProducts, updateBannerCartItems, type BannerProductHit } from "@/actions/bannerActions";
import { Input } from "@/components/ui/Input";

export interface EditorBundleItem {
  productId: string;
  name: string;
  quantity: number;
  freeQty: number;
}

export function serializeBundle(items: EditorBundleItem[]): string {
  return JSON.stringify(items.map(({ productId, quantity, freeQty }) => ({ productId, quantity, freeQty })));
}

const SMALL_INPUT = "min-h-10 w-20 rounded-lg border-2 border-slate-300 px-2 text-center text-base";

// Picks the products (and quantities, and how many of them are free) that an
// offer banner drops into the retailer's cart when tapped.
export function BannerBundleEditor({
  items,
  onChange,
}: {
  items: EditorBundleItem[];
  onChange: (items: EditorBundleItem[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<BannerProductHit[]>([]);
  const [searching, setSearching] = useState(false);

  const searchable = query.trim().length >= 2;
  const visibleHits = searchable ? hits : [];

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchBannerProducts(q);
        if (!cancelled) setHits(result);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  function addProduct(hit: BannerProductHit) {
    if (items.some((i) => i.productId === hit.id)) return;
    onChange([...items, { productId: hit.id, name: hit.name, quantity: 1, freeQty: 0 }]);
    setQuery("");
    setHits([]);
  }

  function update(productId: string, patch: Partial<EditorBundleItem>) {
    onChange(
      items.map((i) => {
        if (i.productId !== productId) return i;
        const next = { ...i, ...patch };
        next.quantity = Math.max(1, Math.floor(next.quantity) || 1);
        next.freeQty = Math.min(next.quantity, Math.max(0, Math.floor(next.freeQty) || 0));
        return next;
      }),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="hidden grid-cols-[1fr_5rem_5rem_2.5rem] gap-2 px-1 text-xs font-semibold text-slate-500 sm:grid">
            <span>Product</span>
            <span className="text-center">Total qty</span>
            <span className="text-center">Of which free</span>
            <span />
          </div>
          {items.map((i) => (
            <div
              key={i.productId}
              className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-slate-200 p-2 sm:grid sm:grid-cols-[1fr_5rem_5rem_2.5rem]"
            >
              <p className="min-w-0 flex-1 text-sm font-medium text-slate-900 sm:flex-none">{i.name}</p>
              <label className="flex items-center gap-1 text-xs text-slate-500 sm:block">
                <span className="sm:hidden">Qty</span>
                <input
                  type="number"
                  min={1}
                  value={i.quantity}
                  onChange={(e) => update(i.productId, { quantity: Number(e.target.value) })}
                  className={SMALL_INPUT}
                  aria-label={`Total quantity of ${i.name}`}
                />
              </label>
              <label className="flex items-center gap-1 text-xs text-slate-500 sm:block">
                <span className="sm:hidden">Free</span>
                <input
                  type="number"
                  min={0}
                  max={i.quantity}
                  value={i.freeQty}
                  onChange={(e) => update(i.productId, { freeQty: Number(e.target.value) })}
                  className={SMALL_INPUT}
                  aria-label={`Free units of ${i.name}`}
                />
              </label>
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x.productId !== i.productId))}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                aria-label={`Remove ${i.name}`}
              >
                <Trash2 size={18} strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a product to add (e.g. lemolate gold)"
          className="min-h-12 text-base"
        />
        {searchable && (visibleHits.length > 0 || searching) && (
          <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border-2 border-slate-200 bg-white shadow-lg">
            {searching && visibleHits.length === 0 && <p className="p-3 text-sm text-slate-400">Searching...</p>}
            {visibleHits.map((h) => {
              const already = items.some((i) => i.productId === h.id);
              return (
                <button
                  key={h.id}
                  type="button"
                  disabled={already}
                  onClick={() => addProduct(h)}
                  className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-40"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{h.name}</span>
                    <span className="block text-xs text-slate-500">
                      {[h.company, `Stock ${h.stock ?? "-"}`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-blue-700">₹{h.price}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Free units are billed at ₹0 on the order. Gift items already priced at ₹0 can leave the free box at 0.
      </p>
    </div>
  );
}

// Free-text note that goes into the order's remarks whenever this offer is in
// the order, for gifts that aren't a catalogue product (e.g. a free lunch box).
export function BannerRemarkField({
  value,
  onChange,
  name,
}: {
  value: string;
  onChange: (value: string) => void;
  name?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">Order remark (optional)</label>
      <Input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={200}
        placeholder="e.g. Free Lunch Box with 50 strips"
        className="min-h-12 text-base"
      />
      <p className="mt-1 text-xs text-slate-500">
        Added to the order&apos;s remarks (and the order email) whenever this offer is in the order.
      </p>
    </div>
  );
}

// Edit panel for an existing banner: same editor plus a Save button.
export function EditBannerCartItems({
  bannerId,
  initialItems,
  initialRemark,
}: {
  bannerId: string;
  initialItems: EditorBundleItem[];
  initialRemark: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [remark, setRemark] = useState(initialRemark);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const result = await updateBannerCartItems(bannerId, serializeBundle(items), remark);
      setMessage(result.ok ? { ok: true, text: "Saved." } : { ok: false, text: result.error ?? "Could not save." });
    } catch {
      setMessage({ ok: false, text: "Could not save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <BannerBundleEditor items={items} onChange={setItems} />
      <BannerRemarkField value={remark} onChange={setRemark} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save cart items"}
        </button>
        {message && (
          <span className={message.ok ? "text-sm font-medium text-green-700" : "text-sm font-medium text-red-600"}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
