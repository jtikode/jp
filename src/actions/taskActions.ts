"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { createTaskSchema } from "@/lib/validators";
import type { ActionResult } from "@/actions/employeeActions";
import type { Role } from "@/generated/prisma/client";

const ANY_STAFF: Role[] = ["ADMIN", "SALESMAN", "TELECALLER", "WAREHOUSE"];

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Admin-defined task, for either one named employee or every employee of a
// role (assignTo is "user:<id>" or "role:<ROLE>").
export async function createTask(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const assignTo = (formData.get("assignTo") as string | null) ?? "";
  const [kind, value] = assignTo.split(":");
  if (kind !== "user" && kind !== "role") {
    return { ok: false, error: "Choose who this task is for." };
  }

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    recurrence: formData.get("recurrence"),
    scheduledTime: formData.get("scheduledTime"),
    dayOfWeek: formData.get("dayOfWeek"),
    dayOfMonth: formData.get("dayOfMonth"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the details." };
  }
  if (parsed.data.recurrence === "WEEKLY" && parsed.data.dayOfWeek == null) {
    return { ok: false, error: "Choose a day of the week." };
  }
  if (parsed.data.recurrence === "MONTHLY" && parsed.data.dayOfMonth == null) {
    return { ok: false, error: "Choose a day of the month." };
  }

  const task = await db.task.create({
    data: {
      orgId: session.orgId,
      title: parsed.data.title,
      description: parsed.data.description,
      recurrence: parsed.data.recurrence,
      scheduledTime: parsed.data.scheduledTime,
      dayOfWeek: parsed.data.recurrence === "WEEKLY" ? parsed.data.dayOfWeek : undefined,
      dayOfMonth: parsed.data.recurrence === "MONTHLY" ? parsed.data.dayOfMonth : undefined,
      assignedToId: kind === "user" ? value : undefined,
      assignedRole: kind === "role" ? (value as Role) : undefined,
    },
  });

  // ONCE tasks are due immediately — every other recurrence picks up its
  // first occurrence the next time a board/dashboard loads.
  if (task.recurrence === "ONCE") {
    const today = startOfToday();
    await db.taskOccurrence.create({
      data: { orgId: session.orgId, taskId: task.id, originalDate: today, scheduledDate: today },
    });
  }

  revalidatePath("/team/admin/tasks");
  revalidatePath("/team/board");
  return { ok: true };
}

export async function toggleTaskActive(taskId: string, active: boolean): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.task.update({ where: { id: taskId }, data: { active } });

  revalidatePath("/team/admin/tasks");
}

/** Lets an employee add their own one-off task, due today, from their own dashboard. */
export async function createOwnTask(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertRole(ANY_STAFF);
  const db = getOrgScopedDb(session.orgId);

  const title = (formData.get("title") as string | null)?.trim();
  if (!title) return { ok: false, error: "Title is required." };
  const description = (formData.get("description") as string | null)?.trim() || undefined;

  const today = startOfToday();
  const task = await db.task.create({
    data: {
      orgId: session.orgId,
      title,
      description,
      recurrence: "ONCE",
      assignedToId: session.userId,
    },
  });
  await db.taskOccurrence.create({
    data: { orgId: session.orgId, taskId: task.id, originalDate: today, scheduledDate: today },
  });

  revalidatePath("/team/warehouse");
  revalidatePath("/team/board");
  return { ok: true };
}

// Called from an employee's own dashboard, or from the shared board where
// the device's session may belong to whoever is operating it rather than
// the employee whose tile was tapped — employeeUserId is always the person
// the completion is recorded against.
export async function markTaskComplete(occurrenceId: string, employeeUserId: string): Promise<void> {
  const session = await assertRole(ANY_STAFF);
  const db = getOrgScopedDb(session.orgId);

  await db.taskOccurrence.update({
    where: { id: occurrenceId },
    data: { status: "AWAITING_APPROVAL", completedAt: new Date(), completedById: employeeUserId },
  });

  revalidatePath("/team/warehouse");
  revalidatePath("/team/board");
}

export async function approveTaskOccurrence(occurrenceId: string): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.taskOccurrence.update({
    where: { id: occurrenceId },
    data: { status: "APPROVED", approvedAt: new Date(), approvedById: session.userId },
  });

  revalidatePath("/team/admin/tasks");
  revalidatePath("/team/board");
}

/** Sends a task back to the employee, marked rejected, so they can redo and resubmit it. */
export async function rejectTaskOccurrence(occurrenceId: string): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.taskOccurrence.update({
    where: { id: occurrenceId },
    data: { status: "REJECTED" },
  });

  revalidatePath("/team/admin/tasks");
  revalidatePath("/team/board");
}

/**
 * Simple yes/no daily attendance for warehouse staff, reusing the shared
 * Attendance model: "no" records an ABSENT row; "yes" just clears any
 * ABSENT row so the day reads as worked, matching how salesman attendance
 * already treats "no row" as a normal working day.
 */
export async function markWarehouseAttendance(present: boolean): Promise<void> {
  const session = await assertRole(["WAREHOUSE"]);
  const db = getOrgScopedDb(session.orgId);
  const userId = session.userId as string;
  const date = startOfToday();

  if (present) {
    await db.attendance.deleteMany({ where: { userId, date } });
  } else {
    await db.attendance.upsert({
      where: { userId_date: { userId, date } },
      update: { status: "ABSENT" },
      create: { orgId: session.orgId, userId, date, status: "ABSENT" },
    });
  }

  revalidatePath("/team/warehouse");
}
