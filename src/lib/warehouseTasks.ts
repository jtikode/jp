import { db } from "@/lib/db";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isDueOn(
  task: {
    recurrence: "WEEKLY" | "MONTHLY" | "ONCE";
    dayOfWeek: number | null;
    dayOfMonth: number | null;
  },
  date: Date,
): boolean {
  // ONCE tasks get their single occurrence created directly at creation
  // time (see createAdHocWarehouseTask) — they never recur via this check.
  if (task.recurrence === "ONCE") return false;
  if (task.recurrence === "WEEKLY") return date.getDay() === task.dayOfWeek;
  return date.getDate() === task.dayOfMonth;
}

/**
 * Called whenever the warehouse dashboard loads. Rolls any incomplete
 * occurrence forward to today (this is what makes a missed or unfinished
 * task "automatically" shift to the next day — there's no cron here, so the
 * shift happens lazily the next time anyone opens the page), then makes sure
 * today has an occurrence for every task whose recurrence rule matches
 * today's date, and finally returns everything due today.
 */
export async function getTodaysTaskOccurrences() {
  const today = startOfToday();

  await db.warehouseTaskOccurrence.updateMany({
    where: { completed: false, scheduledDate: { lt: today } },
    data: { scheduledDate: today },
  });

  const activeTasks = await db.warehouseTask.findMany({ where: { active: true } });
  for (const task of activeTasks) {
    if (!isDueOn(task, today)) continue;
    await db.warehouseTaskOccurrence.upsert({
      where: { taskId_originalDate: { taskId: task.id, originalDate: today } },
      update: {},
      create: { taskId: task.id, originalDate: today, scheduledDate: today },
    });
  }

  return db.warehouseTaskOccurrence.findMany({
    where: { scheduledDate: today, completed: false },
    include: { task: true },
    orderBy: { task: { title: "asc" } },
  });
}

/** Pushes every still-open task due today to tomorrow — used when today's attendance is "No". */
export async function shiftTodaysTasksToTomorrow(): Promise<void> {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await db.warehouseTaskOccurrence.updateMany({
    where: { scheduledDate: today, completed: false },
    data: { scheduledDate: tomorrow },
  });
}
