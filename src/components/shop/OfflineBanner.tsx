"use client";

import { useEffect, useState } from "react";
import { t, type Lang } from "@/lib/i18n";

// Persistent thin banner while the device has no connection, so a retailer
// browsing cached/saved data knows why nothing is updating — distinct from
// PendingOrdersSync's banner, which only appears once an order is actually
// queued.
export function OfflineBanner({ lang }: { lang: Lang }) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Reading navigator.onLine only exists client-side, so the initial
    // check has to happen in an effect rather than a lazy useState — same
    // pattern used by CartProvider's storage hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOffline(!navigator.onLine);
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="bg-slate-800 px-4 py-1.5 text-center text-xs font-medium text-white">
      {t(lang, "shop_offline_indicator")}
    </div>
  );
}
