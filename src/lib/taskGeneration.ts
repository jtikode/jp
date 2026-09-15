import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getStartOfIstDayUtc, getIstDateParts, getIstNow } from "@/lib/istTime";
import type { Role } from "@/generated/prisma/client";

function isDueOn(
  task: { recurrence: string; dayOfWeek: number | null; dayOfMonth: number | null },
  date: Date,
): boolean {
  // ONCE tasks get their single occurrence created directly at creation time
  // — they never recur via this check.
  if (task.recurrence === "ONCE") return false;
  if (task.recurrence === "DAILY") return true;
  if (task.recurrence === "WEEKLY") return getIstNow(date).dayOfWeek === task.dayOfWeek;
  return getIstDateParts(date).day === task.dayOfMonth;
}

// Makes sure today's occurrences are in the right state for every active
// task. Called whenever the board loads — no cron. Two different rules by
// recurrence:
//   - DAILY: tied strictly to its own day. A missed day is never rolled
//     forward — it just stays PENDING against that original date, so a day
//     nobody completed it reads as a blank/missed day in the completion
//     chart instead of silently reappearing later.
//   - WEEKLY / MONTHLY / ONCE: the opposite — an unresolved occurrence
//     (still PENDING or sent back REJECTED) keeps rolling forward day to
//     day, same row, same originalDate (so the chart still credits/blames
//     whenever it was ACTUALLY due), until someone finally completes it. A
//     new occurrence for the next due date only gets created once the
//     current one has been resolved (AWAITING_APPROVAL or APPROVED).
export async function ensureTodaysOccurrences(orgId: string): Promise<void> {
  const db = getOrgScopedDb(orgId);
  const today = getStartOfIstDayUtc();

  const activeTasks = await db.task.findMany({ where: { active: true } });
  if (activeTasks.length === 0) return;

  // One row per task — its single most recent occurrence — fetched in one
  // query regardless of how much occurrence history has piled up.
  const latestOccurrences = await db.taskOccurrence.findMany({
    where: { taskId: { in: activeTasks.map((t) => t.id) } },
    orderBy: { originalDate: "desc" },
    distinct: ["taskId"],
  });
  const latestByTask = new Map(latestOccurrences.map((o) => [o.taskId, o]));

  for (const task of activeTasks) {
    const latest = latestByTask.get(task.id);
    const alreadyHasTodaysOccurrence = latest?.originalDate.getTime() === today.getTime();

    if (task.recurrence === "DAILY") {
      if (isDueOn(task, today) && !alreadyHasTodaysOccurrence) {
        await db.taskOccurrence.create({
          data: { orgId, taskId: task.id, originalDate: today, scheduledDate: today },
        });
      }
      continue;
    }

    const isUnresolved = latest != null && (latest.status === "PENDING" || latest.status === "REJECTED");
    if (isUnresolved) {
      if (latest!.scheduledDate.getTime() !== today.getTime()) {
        await db.taskOccurrence.update({ where: { id: latest!.id }, data: { scheduledDate: today } });
      }
      continue;
    }

    if (isDueOn(task, today) && !alreadyHasTodaysOccurrence) {
      await db.taskOccurrence.create({
        data: { orgId, taskId: task.id, originalDate: today, scheduledDate: today },
      });
    }
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
  const today = getStartOfIstDayUtc();

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
