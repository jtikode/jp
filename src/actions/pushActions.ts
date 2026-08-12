"use server";

import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertStoreSession } from "@/lib/retailerPermissions";
import { isWebPushConfigured } from "@/lib/webPush";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

// Only real browser push services ever appear here — a genuine
// pushManager.subscribe() call can't return anything else. Enforcing this
// stops a malicious client from registering an arbitrary internal/private
// URL as its "endpoint", which sendPushToStore would later POST to
// (server-side, with VAPID auth headers attached) every time an order's
// status changes — an SSRF vector otherwise.
const ALLOWED_PUSH_HOSTS = [
  "fcm.googleapis.com",
  "android.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
  "notify.windows.com",
];

function isTrustedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && ALLOWED_PUSH_HOSTS.some((host) => url.hostname === host);
  } catch {
    return false;
  }
}

export async function subscribeToPush(
  subscription: PushSubscriptionInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!isWebPushConfigured()) {
    return { ok: false, error: "Push notifications are not configured on this server." };
  }

  if (!isTrustedPushEndpoint(subscription.endpoint)) {
    return { ok: false, error: "Unrecognized push service." };
  }

  const session = await assertStoreSession();
  const db = getOrgScopedDb(session.orgId);

  await db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { storeId: session.storeId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    create: {
      orgId: session.orgId,
      storeId: session.storeId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });

  return { ok: true };
}
