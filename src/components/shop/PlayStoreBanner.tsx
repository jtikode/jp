"use client";

import { useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { PLAY_STORE_URL, shouldOfferPlayStore } from "@/lib/playStore";
import { track } from "@/lib/analytics";
import { t, type Lang } from "@/lib/i18n";

const DISMISS_KEY = "jpt_play_banner_dismissed";

function subscribe(): () => void {
  return () => {};
}

function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

// Shown in a normal browser (not inside the Play app) so visitors to
// app.jpkop.in are pointed at the Play Store listing.
export function PlayStoreBanner({ lang }: { lang: Lang }) {
  const canOffer = useSyncExternalStore(subscribe, shouldOfferPlayStore, () => false);
  const [dismissed, setDismissed] = useState(wasDismissed);

  if (!canOffer || dismissed) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage blocked — it just comes back on the next page.
    }
    setDismissed(true);
  }

  return (
    <div className="flex items-center gap-3 bg-blue-700 px-3 py-2 text-white">
      <p className="min-w-0 flex-1 text-sm font-semibold leading-tight">{t(lang, "shop_play_banner_text")}</p>
      <a
        href={PLAY_STORE_URL}
        onClick={() => track("select_content", { content_type: "play_store_banner" })}
        className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-50"
      >
        {t(lang, "shop_play_banner_button")}
      </a>
      <button type="button" onClick={dismiss} aria-label="Close" className="shrink-0 rounded-full p-1 hover:bg-blue-600">
        <X size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
