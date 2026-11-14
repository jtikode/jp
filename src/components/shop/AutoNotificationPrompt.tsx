"use client";

import { useEffect } from "react";
import { subscribeToPush } from "@/actions/pushActions";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const ASKED_SESSION_KEY = "jp-notif-asked-session";
const ASK_COUNT_KEY = "jp-notif-ask-count";
// Stop nagging someone who keeps dismissing the system prompt.
const MAX_ASKS = 4;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage can be blocked (private mode); the prompt then just runs each load.
  }
}

// Asks for notification permission by itself shortly after a retailer opens the
// app, instead of waiting for them to find and tap the "Enable order updates"
// banner (almost nobody does). If permission is already granted it quietly
// re-registers the phone with the server every session, which also repairs a
// phone whose subscription row was removed server-side while the browser still
// holds a (now unregistered) subscription.
export function AutoNotificationPrompt() {
  useEffect(() => {
    if (!VAPID_PUBLIC_KEY || !("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "denied") return;
    // Once per app launch, not on every page navigation.
    if (safeGet(sessionStorage, ASKED_SESSION_KEY)) return;

    let cancelled = false;

    async function run() {
      try {
        if (Notification.permission === "default") {
          const asks = Number(safeGet(localStorage, ASK_COUNT_KEY) ?? "0");
          if (asks >= MAX_ASKS) return;
          safeSet(localStorage, ASK_COUNT_KEY, String(asks + 1));
          const result = await Notification.requestPermission();
          if (result !== "granted") return;
        }
        if (cancelled || Notification.permission !== "granted") return;

        const registration = await navigator.serviceWorker.ready;
        const subscription =
          (await registration.pushManager.getSubscription()) ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!) as BufferSource,
          }));

        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys) return;
        await subscribeToPush({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        });
      } catch {
        // Unsupported browser or the user closed the prompt; nothing to do.
      }
    }

    safeSet(sessionStorage, ASKED_SESSION_KEY, "1");
    // Let the first screen paint before the system prompt covers it.
    const timer = window.setTimeout(run, 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
