"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Chrome/Android fire `beforeinstallprompt` once per page load when the PWA
// criteria (manifest + service worker) are met and it isn't already
// installed — we stash that event so a normal button click can trigger the
// native install UI later instead of relying on the browser's own mini-bar.
export function ShopInstallButton({ lang }: { lang: Lang }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    function handlePrompt(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  if (!installEvent) return null;

  async function handleInstall() {
    await installEvent!.prompt();
    await installEvent!.userChoice;
    setInstallEvent(null);
  }

  return (
    <button
      onClick={handleInstall}
      className="flex h-11 items-center gap-1.5 rounded-full bg-blue-700 px-3.5 text-xs font-bold text-white hover:bg-blue-800"
      aria-label={t(lang, "shop_install_app")}
      title={t(lang, "shop_install_app")}
    >
      <Download size={16} strokeWidth={2} />
      {t(lang, "shop_install_app")}
    </button>
  );
}
