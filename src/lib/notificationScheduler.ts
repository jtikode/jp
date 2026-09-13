import cron from "node-cron";
import { db } from "@/lib/db";
import { sendPushToOrg, sendPushToStore } from "@/lib/webPush";
import { getIstNow, getStartOfIstDayUtc } from "@/lib/istTime";

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
    runDueOrderReminders().catch((err) => console.error("orderReminder tick failed:", err));
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

// A retailer's own weekly "remind me to order" preference, set once from the
// shop app (day of week + time, IST) and fired every week from here — as
// opposed to ScheduledNotification above, which is a one-off admin-composed
// send.
export async function runDueOrderReminders(): Promise<void> {
  const { dayOfWeek, hour, minute } = getIstNow();
  const startOfToday = getStartOfIstDayUtc();

  const due = await db.orderReminder.findMany({
    where: { active: true, dayOfWeek, hour, minute },
  });

  for (const reminder of due) {
    // Atomically claim it: only fire once per IST calendar day, even if the
    // cron ticks more than once in the same minute window or a second
    // worker runs the same schedule.
    const claimed = await db.orderReminder.updateMany({
      where: {
        id: reminder.id,
        active: true,
        OR: [{ lastSentAt: null }, { lastSentAt: { lt: startOfToday } }],
      },
      data: { lastSentAt: new Date() },
    });
    if (claimed.count === 0) continue;

    try {
      await sendPushToStore(reminder.orgId, reminder.storeId, {
        title: "J P Traders",
        body: "Time to place your weekly order — don't run out of your generic products.",
        url: "/shop/products",
      });
    } catch (err) {
      console.error("Failed to send order reminder", reminder.id, err);
    }
  }
}
