"use client";

import type { CartLine } from "@/actions/orderActions";

export interface PendingOrder {
  id: string;
  lines: CartLine[];
  notes: string;
  createdAt: string;
}

const STORAGE_KEY = "jpt_shop_pending_orders";

function read(): PendingOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingOrder[]) : [];
  } catch {
    return [];
  }
}

function write(orders: PendingOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function getPendingOrders(): PendingOrder[] {
  return read();
}

export function addPendingOrder(lines: CartLine[], notes: string): PendingOrder {
  const order: PendingOrder = {
    id: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    lines,
    notes,
    createdAt: new Date().toISOString(),
  };
  write([...read(), order]);
  return order;
}

export function removePendingOrder(id: string) {
  write(read().filter((o) => o.id !== id));
}

/** Anything that isn't a normal server-rejected result (e.g. cart empty,
 * item unavailable) is treated as "couldn't reach the server" — a fetch
 * thrown while offline surfaces as a TypeError with no useful message. */
export function isLikelyNetworkError(err: unknown): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine ? true : err instanceof TypeError;
}
