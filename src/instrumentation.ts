export async function register() {
  // The scheduler uses node-cron + Prisma, both Node-only — never load it
  // under the Edge runtime.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startNotificationScheduler } = await import("@/lib/notificationScheduler");
    startNotificationScheduler();
  }
}
