"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  // Set when this item was added at a clearance (near-expiry) special rate —
  // carried through so checkout can tell placeOrder which deal to re-verify
  // and price from, instead of the normal catalog price.
  expiryItemId?: string;
  // Set when this item was added at a Wednesday Deal price — same purpose as
  // expiryItemId, for the weekly-deal pricing/quantity-cap instead.
  dealId?: string;
  // Set when this line came from tapping an Offer banner. `freeQty` of the
  // line's units are free; checkout re-verifies the offer on the server, which
  // is the only place a free unit is actually honoured.
  bannerId?: string;
  bannerTitle?: string;
  bannerRemark?: string;
  freeQty?: number;
}

export interface BundleLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  freeQty: number;
}

export type AddBundleResult = { ok: true; sets: number } | { ok: false; reason: "conflict" };

interface CartContextValue {
  items: CartItem[];
  setQuantity: (product: Omit<CartItem, "quantity">, quantity: number) => void;
  removeItem: (productId: string) => void;
  addBundle: (bannerId: string, title: string | null, lines: BundleLine[], remark: string | null) => AddBundleResult;
  removeBundle: (bannerId: string) => void;
  clear: () => void;
  total: number;
  count: number;
}

export function paidQuantity(item: CartItem): number {
  return item.quantity - Math.min(item.freeQty ?? 0, item.quantity);
}

// Editing one line of an offer by hand (quantity stepper elsewhere in the
// shop) breaks the set, so the whole offer's free units are dropped: the
// remaining lines stay as ordinary, fully paid items.
function detachBanner(list: CartItem[], bannerId: string): CartItem[] {
  return list.map((i) =>
    i.bannerId === bannerId
      ? { ...i, bannerId: undefined, bannerTitle: undefined, bannerRemark: undefined, freeQty: undefined }
      : i,
  );
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "jpt_shop_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      // localStorage (not sessionStorage) so the cart survives the app being
      // fully closed/killed by Android and reopened later — the retailer
      // shouldn't lose their in-progress order to a dropped connection or a
      // backgrounded app getting evicted.
      const raw = localStorage.getItem(STORAGE_KEY);
      // localStorage only exists client-side, so this one-time sync from it
      // can't be done as a lazy useState initializer without a hydration
      // mismatch — an effect is the correct place for it here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Ignore malformed/blocked storage — cart just starts empty.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function setQuantity(product: Omit<CartItem, "quantity">, quantity: number) {
    setItems((prev) => {
      const current = prev.find((i) => i.productId === product.productId);
      const base = current?.bannerId ? detachBanner(prev, current.bannerId) : prev;
      if (quantity <= 0) {
        return base.filter((i) => i.productId !== product.productId);
      }
      const existing = base.find((i) => i.productId === product.productId);
      if (existing) {
        return base.map((i) => (i.productId === product.productId ? { ...i, quantity } : i));
      }
      return [...base, { ...product, quantity }];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => {
      const current = prev.find((i) => i.productId === productId);
      const base = current?.bannerId ? detachBanner(prev, current.bannerId) : prev;
      return base.filter((i) => i.productId !== productId);
    });
  }

  // Tapping the same offer again adds another full set (quantities and free
  // units both grow by one set), which is what a retailer wanting 100 strips
  // instead of 50 expects.
  function addBundle(
    bannerId: string,
    title: string | null,
    lines: BundleLine[],
    remark: string | null,
  ): AddBundleResult {
    const blocked = lines.some((l) => {
      const existing = items.find((i) => i.productId === l.productId);
      return (
        existing != null &&
        ((existing.bannerId != null && existing.bannerId !== bannerId) || existing.expiryItemId || existing.dealId)
      );
    });
    if (blocked) return { ok: false, reason: "conflict" };

    let next = items;
    for (const l of lines) {
      const existing = next.find((i) => i.productId === l.productId);
      if (existing) {
        next = next.map((i) =>
          i.productId === l.productId
            ? {
                ...i,
                unitPrice: l.unitPrice,
                quantity: i.quantity + l.quantity,
                bannerId,
                bannerTitle: title ?? undefined,
                bannerRemark: remark ?? undefined,
                freeQty: (i.bannerId === bannerId ? (i.freeQty ?? 0) : 0) + l.freeQty,
              }
            : i,
        );
      } else {
        next = [
          ...next,
          {
            productId: l.productId,
            name: l.name,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            bannerId,
            bannerTitle: title ?? undefined,
            bannerRemark: remark ?? undefined,
            freeQty: l.freeQty,
          },
        ];
      }
    }
    setItems(next);

    const first = lines[0];
    const added = first ? next.find((i) => i.productId === first.productId) : undefined;
    return { ok: true, sets: first && added ? Math.max(1, Math.floor(added.quantity / first.quantity)) : 1 };
  }

  function removeBundle(bannerId: string) {
    setItems((prev) => prev.filter((i) => i.bannerId !== bannerId));
  }

  function clear() {
    setItems([]);
  }

  const total = items.reduce((sum, i) => sum + i.unitPrice * paidQuantity(i), 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, setQuantity, removeItem, addBundle, removeBundle, clear, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
