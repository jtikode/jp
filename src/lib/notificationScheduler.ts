import cron from "node-cron";
import { db } from "@/lib/db";
import { sendPushToOrg } from "@/lib/webPush";

let started = false;

// Started once from instrumentation.ts when the server process boots. There's
// no other job runner in this app — recurring tasks are generated lazily on
// page load instead — so this is the one place anything here fires on a
// real clock rather than a request.
export function startNotificationScheduler(): void {
  if (started) return;
  started = true;

  cron.schedule("* * * * *", () => {
    runDueNotifications().catch((err) => console.error("notificationScheduler tick failed:", err));
  });
}

export async function runDueNotifications(): Promise<void> {
  const due = await db.scheduledNotification.findMany({
    where: { status: "PENDING", scheduledAt: { lte: new Date() } },
  });

  for (const notif of due) {
    // Atomically claim it first: if a second process is running the same
    // cron (e.g. a multi-worker deploy), only one of them flips PENDING ->
    // SENT and actually sends — the other sees count 0 and skips it.
    const claimed = await db.scheduledNotification.updateMany({
      where: { id: notif.id, status: "PENDING" },
      data: { status: "SENT", sentAt: new Date() },
    });
    if (claimed.count === 0) continue;

    try {
      const { sentCount, storeCount } = await sendPushToOrg(notif.orgId, {
        title: notif.title,
        body: notif.body,
        url: notif.url ?? undefined,
      });
      await db.scheduledNotification.update({
        where: { id: notif.id },
        data: { sentCount, storeCount },
      });
    } catch (err) {
      console.error("Failed to send scheduled notification", notif.id, err);
      await db.scheduledNotification.update({ where: { id: notif.id }, data: { status: "FAILED" } });
    }
  }
}
