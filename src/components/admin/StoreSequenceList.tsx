"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { reorderStoreSequence } from "@/actions/storeActions";
import { buildWhatsAppLink, buildVisitReminderMessage } from "@/lib/waLink";

interface StoreRow {
  id: string;
  externalCode: string | null;
  name: string;
  address: string;
  phone: string | null;
}

export function StoreSequenceList({ routeId, stores }: { routeId: string; stores: StoreRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(storeId: string, direction: "up" | "down") {
    startTransition(async () => {
      await reorderStoreSequence(routeId, storeId, direction);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {stores.map((store, i) => (
        <div
          key={store.id}
          className="flex items-center gap-3 rounded-xl border-2 border-slate-200 p-3"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">{store.name}</p>
            <p className="truncate text-sm text-slate-500">{store.address}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              disabled={pending || i === 0}
              onClick={() => move(store.id, "up")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-slate-300 text-slate-600 disabled:opacity-30"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={pending || i === stores.length - 1}
              onClick={() => move(store.id, "down")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-slate-300 text-slate-600 disabled:opacity-30"
              aria-label="Move down"
            >
              ↓
            </button>
            {store.phone && (
              <a
                href={buildWhatsAppLink(store.phone, buildVisitReminderMessage())}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 items-center rounded-lg bg-green-600 px-2 text-xs font-semibold text-white hover:bg-green-700"
              >
                WhatsApp
              </a>
            )}
            <Link
              href={`/admin/outstanding/${store.id}`}
              className="flex h-8 items-center rounded-lg bg-amber-600 px-2 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Outstanding
            </Link>
          </div>
        </div>
      ))}
      {stores.length === 0 && (
        <p className="py-6 text-center text-slate-400">No stores on this route yet.</p>
      )}
    </div>
  );
}
