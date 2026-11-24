import cron from "node-cron";
import { db } from "@/lib/db";
import { sendPushToOrg, sendPushToStore } from "@/lib/webPush";
import { getIstNow, getStartOfIstDayUtc } from "@/lib/istTime";
import { runPaymentDigest } from "@/lib/paymentDigest";

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
    runPaymentDigest().catch((err) => console.error("paymentDigest tick failed:", err));
    queueOutstationLastCall().catch((err) => console.error("outstationLastCall tick failed:", err));
  });
}

// Tuesday, Thursday and Saturday are the outstation dispatch days. At noon on
// those days every retailer gets a push saying the last order for that
// dispatch is taken until 5 PM (the shop closes orders at 5 PM, see
// orderCutoff.ts). It is queued as an ordinary ScheduledNotification so it is
// sent by runDueNotifications above and shows up in the admin list.
const OUTSTATION_DAYS = new Set([2, 4, 6]); // Tue, Thu, Sat
const LAST_CALL_HOUR_IST = 12;
// Tolerates a server restart just after noon, but not a send hours late.
const LAST_CALL_WINDOW_MINUTES = 15;

export async function queueOutstationLastCall(): Promise<void> {
  const { dayOfWeek, hour, minute, dateKey } = getIstNow();
  if (!OUTSTATION_DAYS.has(dayOfWeek) || hour !== LAST_CALL_HOUR_IST || minute >= LAST_CALL_WINDOW_MINUTES) return;

  const orgs = await db.organization.findMany({ select: { id: true } });
  for (const org of orgs) {
    const admin = await db.user.findFirst({ where: { orgId: org.id, role: "ADMIN" }, select: { id: true } });
    if (!admin) continue;
    try {
      // One fixed id per org per day: a second tick, or a second worker
      // running the same cron, hits the primary key and cannot queue it twice.
      await db.scheduledNotification.create({
        data: {
          id: `outstation-last-call-${org.id}-${dateKey}`,
          orgId: org.id,
          title: "Last order today till 5 PM",
          body: "आउटस्टेशन डिस्पॅचसाठी आजची शेवटची ऑर्डर संध्याकाळी ५ वाजेपर्यंत घेतली जाईल. Last order for outstation dispatch is accepted till 5 PM today.",
          url: "/shop/products",
          scheduledAt: new Date(),
          createdById: admin.id,
        },
      });
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") continue; // already queued today
      throw err;
    }
  }
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
        body: "Time to place your weekly order, don't run out of your generic products.",
        url: "/shop/products",
      });
    } catch (err) {
      console.error("Failed to send order reminder", reminder.id, err);
    }
  }
}
