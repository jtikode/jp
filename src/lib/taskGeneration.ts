import { getOrgScopedDb } from "@/lib/orgScopedDb";
import type { Role } from "@/generated/prisma/client";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isDueOn(
  task: { recurrence: string; dayOfWeek: number | null; dayOfMonth: number | null },
  date: Date,
): boolean {
  // ONCE tasks get their single occurrence created directly at creation time
  // — they never recur via this check.
  if (task.recurrence === "ONCE") return false;
  if (task.recurrence === "DAILY") return true;
  if (task.recurrence === "WEEKLY") return date.getDay() === task.dayOfWeek;
  return date.getDate() === task.dayOfMonth;
}

// Makes sure today has an occurrence for every active task whose recurrence
// rule matches today's date. Called whenever the board loads — no cron.
// Unlike the old warehouse-only version, a missed occurrence is never
// rolled forward: it just stays PENDING against its own original date, so a
// day nobody completed it reads as blank in the completion chart instead of
// silently reappearing later.
export async function ensureTodaysOccurrences(orgId: string): Promise<void> {
  const db = getOrgScopedDb(orgId);
  const today = startOfToday();

  const activeTasks = await db.task.findMany({ where: { active: true } });
  for (const task of activeTasks) {
    if (!isDueOn(task, today)) continue;
    await db.taskOccurrence.upsert({
      where: { taskId_originalDate: { taskId: task.id, originalDate: today } },
      update: {},
      create: { orgId, taskId: task.id, originalDate: today, scheduledDate: today },
    });
  }
}

export interface EmployeeTaskView {
  occurrenceId: string;
  taskId: string;
  title: string;
  description: string | null;
  recurrence: string;
  scheduledTime: string | null;
  status: string;
}

const RECURRENCE_ORDER: Record<string, number> = { DAILY: 0, WEEKLY: 1, MONTHLY: 2, ONCE: 3 };

// Today's tasks for one employee: tasks assigned directly to them, plus
// role-wide tasks (assignedToId null, assignedRole matching their role) —
// this is what preserves "any warehouse staff on shift can complete it" for
// tasks nobody assigned to a specific person. Ordered daily first, then
// weekly, then monthly/once; within a group, earliest scheduled time first.
export async function getTodaysTasksForEmployee(
  orgId: string,
  userId: string,
  role: Role,
): Promise<EmployeeTaskView[]> {
  const db = getOrgScopedDb(orgId);
  await ensureTodaysOccurrences(orgId);
  const today = startOfToday();

  const occurrences = await db.taskOccurrence.findMany({
    where: {
      scheduledDate: today,
      task: {
        active: true,
        OR: [{ assignedToId: userId }, { assignedToId: null, assignedRole: role }],
      },
    },
    include: { task: true },
  });

  return occurrences
    .map((o) => ({
      occurrenceId: o.id,
      taskId: o.taskId,
      title: o.task.title,
      description: o.task.description,
      recurrence: o.task.recurrence,
      scheduledTime: o.task.scheduledTime,
      status: o.status,
    }))
    .sort((a, b) => {
      const orderDiff = RECURRENCE_ORDER[a.recurrence] - RECURRENCE_ORDER[b.recurrence];
      if (orderDiff !== 0) return orderDiff;
      if (a.scheduledTime && b.scheduledTime) return a.scheduledTime.localeCompare(b.scheduledTime);
      if (a.scheduledTime) return -1;
      if (b.scheduledTime) return 1;
      return a.title.localeCompare(b.title);
    });
}
