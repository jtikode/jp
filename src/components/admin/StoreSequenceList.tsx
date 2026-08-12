"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  reorderStoreSequence,
  reorderAllStores,
  removeStoreFromRoute,
} from "@/actions/storeActions";
import { buildWhatsAppLink, buildVisitReminderMessage } from "@/lib/waLink";
import { storeLabel } from "@/lib/storeLabel";
import { shopActivityStatus } from "@/lib/shopActivity";

interface StoreRow {
  id: string;
  externalCode: string | null;
  name: string;
  address: string;
  phone: string | null;
  shopActivated: boolean;
  lastLoginAt: string | null;
}

export function StoreSequenceList({ routeId, stores }: { routeId: string; stores: StoreRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(stores);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Reflect server-refreshed data once a reorder/remove completes.
  if (items !== stores && items.length !== stores.length) {
    setItems(stores);
  }

  function move(storeId: string, direction: "up" | "down") {
    startTransition(async () => {
      await reorderStoreSequence(routeId, storeId, direction);
      router.refresh();
    });
  }

  function remove(storeId: string) {
    if (!window.confirm("Remove this store from this route? It stays on any other routes it's on.")) {
      return;
    }
    startTransition(async () => {
      await removeStoreFromRoute(routeId, storeId);
      router.refresh();
    });
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(index: number, e: React.DragEvent) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  }

  function handleDrop() {
    setDragIndex(null);
    startTransition(async () => {
      await reorderAllStores(
        routeId,
        items.map((s) => s.id),
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((store, i) => (
        <div
          key={store.id}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(i, e)}
          onDrop={handleDrop}
          onDragEnd={() => setDragIndex(null)}
          className={`flex flex-col gap-3 rounded-xl border-2 p-3 sm:flex-row sm:items-center ${
            dragIndex === i ? "border-blue-400 bg-blue-50" : "border-slate-200"
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span
              className="flex h-9 w-6 shrink-0 cursor-grab items-center justify-center text-slate-400 active:cursor-grabbing"
              title="Drag to reorder"
            >
              ⠿
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 truncate font-semibold text-slate-900">
                <span>{storeLabel(store.name, store.externalCode)}</span>
                {(() => {
                  const activity = shopActivityStatus(store.shopActivated, store.lastLoginAt);
                  return (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${activity.className}`}>
                      {activity.label}
                    </span>
                  );
                })()}
              </p>
              <p className="truncate text-sm text-slate-500">{store.address}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <button
              type="button"
              disabled={pending || i === 0}
              onClick={() => move(store.id, "up")}
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-slate-300 text-slate-600 disabled:opacity-30"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={pending || i === items.length - 1}
              onClick={() => move(store.id, "down")}
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-slate-300 text-slate-600 disabled:opacity-30"
              aria-label="Move down"
            >
              ↓
            </button>
            {store.phone && (
              <a
                href={buildWhatsAppLink(store.phone, buildVisitReminderMessage())}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 items-center rounded-lg bg-green-600 px-3 text-sm font-semibold text-white hover:bg-green-700"
              >
                WhatsApp
              </a>
            )}
            <Link
              href={`/admin/outstanding/${store.id}`}
              className="flex h-10 items-center rounded-lg bg-amber-600 px-3 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Outstanding
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(store.id)}
              className="flex h-10 items-center rounded-lg border-2 border-red-300 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="py-6 text-center text-slate-400">No stores on this route yet.</p>
      )}
    </div>
  );
}
