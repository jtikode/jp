"use client";

import { useEffect, useState } from "react";
import { subscribeToPush } from "@/actions/pushActions";
import { t, type Lang } from "@/lib/i18n";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "unsupported" | "checking" | "subscribed" | "blocked" | "available";

export function NotificationOptIn({ lang }: { lang: Lang }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    // One-time client-only capability check against browser Notification/
    // ServiceWorker APIs, not React state — there's no clean escape hatch
    // for that in this lint rule (same rationale as CartProvider's hydration effect).
    if (!VAPID_PUBLIC_KEY || !("Notification" in window) || !("serviceWorker" in navigator)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("blocked");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "subscribed" : "available"))
      .catch(() => setStatus("unsupported"));
  }, []);

  async function handleEnable() {
    if (!VAPID_PUBLIC_KEY) return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus(permission === "denied" ? "blocked" : "available");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    const json = subscription.toJSON();
    await subscribeToPush({
      endpoint: json.endpoint as string,
      keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
    });
    setStatus("subscribed");
  }

  if (status === "unsupported" || status === "checking" || status === "subscribed") return null;

  return (
    <button
      type="button"
      onClick={handleEnable}
      disabled={status === "blocked"}
      className="w-full rounded-xl border-2 border-blue-200 bg-blue-50 p-3 text-left text-sm font-semibold text-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      🔔 {status === "blocked" ? t(lang, "shop_notifications_blocked") : t(lang, "shop_enable_notifications")}
    </button>
  );
}
