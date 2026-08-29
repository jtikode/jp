"use client";

import { useCallback, useEffect, useState } from "react";
import { placeOrder } from "@/actions/orderActions";
import { getPendingOrders, removePendingOrder, type PendingOrder } from "@/lib/pendingOrders";
import { t, type Lang } from "@/lib/i18n";

// Renders nothing until an order has been saved locally because the app was
// offline when the retailer tried to submit it. From then on it shows a
// small banner and retries automatically whenever the device comes back
// online (plus a manual "Retry now" for when the browser doesn't fire the
// online event reliably, e.g. some Android WebViews).
export function PendingOrdersSync({ lang }: { lang: Lang }) {
  const [pending, setPending] = useState<PendingOrder[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => setPending(getPendingOrders()), []);

  const flush = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const queued = getPendingOrders();
    if (queued.length === 0) return;

    setSyncing(true);
    for (const order of queued) {
      try {
        const result = await placeOrder(order.lines, order.notes);
        if (result.ok) {
          removePendingOrder(order.id);
        }
        // A server-rejected order (e.g. item no longer available) stays
        // queued so the retailer sees it and can decide what to do — only a
        // successful submit clears it.
      } catch {
        // Still offline or the request failed — leave it queued, try again
        // on the next online event or manual retry.
        break;
      }
    }
    setSyncing(false);
    refresh();
  }, [refresh]);

  useEffect(() => {
    // localStorage only exists client-side, so this one-time read can't be
    // done as a lazy useState initializer without breaking SSR — an effect
    // is the correct place for it here (same pattern as CartProvider).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pending.length === 0) return null;

  return (
    <div className="mx-auto mb-3 flex max-w-2xl items-center justify-between gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-2.5 text-sm">
      <p className="font-medium text-amber-800">
        {t(lang, "shop_pending_orders_label")} ({pending.length})
      </p>
      <button
        type="button"
        onClick={flush}
        disabled={syncing}
        className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {syncing ? t(lang, "shop_syncing") : t(lang, "shop_retry_now")}
      </button>
    </div>
  );
}
