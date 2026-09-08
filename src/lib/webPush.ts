import webpush from "web-push";
import { getOrgScopedDb } from "@/lib/orgScopedDb";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID keys are not configured — push notifications are unavailable.");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function isWebPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT,
  );
}

// Sends a notification to every subscription a retailer's store has opted in
// with (they may have more than one — e.g. phone and desktop). Subscriptions
// that the push service reports as gone (410/404, uninstalled or revoked)
// are deleted so the table doesn't accumulate dead rows.
export async function sendPushToStore(
  orgId: string,
  storeId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  if (!isWebPushConfigured()) return;
  ensureConfigured();

  const db = getOrgScopedDb(orgId);
  const subscriptions = await db.pushSubscription.findMany({ where: { storeId } });
  if (subscriptions.length === 0) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );
}

// Broadcasts to every subscribed retailer across the whole org — used for
// org-wide announcements like a time-boxed flash deal or an admin-composed
// notice, as opposed to sendPushToStore's single-retailer order-status
// updates. Returns delivery counts so the sender can confirm reach.
export async function sendPushToOrg(
  orgId: string,
  payload: { title: string; body: string; url?: string },
): Promise<{ sentCount: number; storeCount: number }> {
  if (!isWebPushConfigured()) return { sentCount: 0, storeCount: 0 };
  ensureConfigured();

  const db = getOrgScopedDb(orgId);
  const subscriptions = await db.pushSubscription.findMany({});
  if (subscriptions.length === 0) return { sentCount: 0, storeCount: 0 };

  const body = JSON.stringify(payload);
  let sentCount = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        );
        sentCount += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );

  const storeCount = new Set(subscriptions.map((s) => s.storeId)).size;
  return { sentCount, storeCount };
}
