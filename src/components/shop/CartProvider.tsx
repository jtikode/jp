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
}

interface CartContextValue {
  items: CartItem[];
  setQuantity: (product: Omit<CartItem, "quantity">, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  total: number;
  count: number;
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
      if (quantity <= 0) {
        return prev.filter((i) => i.productId !== product.productId);
      }
      const existing = prev.find((i) => i.productId === product.productId);
      if (existing) {
        return prev.map((i) => (i.productId === product.productId ? { ...i, quantity } : i));
      }
      return [...prev, { ...product, quantity }];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function clear() {
    setItems([]);
  }

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, setQuantity, removeItem, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
