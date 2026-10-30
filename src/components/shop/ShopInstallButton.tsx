"use client";

import { useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { PLAY_STORE_URL, shouldOfferPlayStore } from "@/lib/playStore";
import { track } from "@/lib/analytics";
import { t, type Lang } from "@/lib/i18n";

function subscribe(): () => void {
  return () => {};
}

// Header button that sends browser visitors to the Google Play listing. It
// disappears inside the installed app, where there's nothing left to download.
export function ShopInstallButton({ lang }: { lang: Lang }) {
  const canOffer = useSyncExternalStore(subscribe, shouldOfferPlayStore, () => false);
  if (!canOffer) return null;

  return (
    <a
      href={PLAY_STORE_URL}
      onClick={() => track("select_content", { content_type: "play_store_header_button" })}
      className="flex h-9 items-center gap-1.5 rounded-full bg-blue-700 px-2.5 text-xs font-bold text-white hover:bg-blue-800 sm:h-11 sm:px-3.5"
      aria-label={t(lang, "shop_install_app")}
      title={t(lang, "shop_install_app")}
    >
      <Download size={16} strokeWidth={2} />
      <span className="hidden sm:inline">{t(lang, "shop_install_app")}</span>
    </a>
  );
}
