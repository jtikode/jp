"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { shiftTodaysTasksToTomorrow } from "@/lib/warehouseTasks";
import { createWarehouseTaskSchema } from "@/lib/validators";
import type { ActionResult } from "@/actions/employeeActions";

export async function createWarehouseTask(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const parsed = createWarehouseTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    recurrence: formData.get("recurrence"),
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

  await db.warehouseTask.create({
    data: {
      orgId: session.orgId,
      title: parsed.data.title,
      description: parsed.data.description,
      recurrence: parsed.data.recurrence,
      dayOfWeek: parsed.data.recurrence === "WEEKLY" ? parsed.data.dayOfWeek : undefined,
      dayOfMonth: parsed.data.recurrence === "MONTHLY" ? parsed.data.dayOfMonth : undefined,
    },
  });

  revalidatePath("/admin/warehouse-tasks");
  return { ok: true };
}

/** Lets warehouse staff add their own one-off task, due today, without going through admin. */
export async function createAdHocWarehouseTask(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertRole(["WAREHOUSE"]);
  const db = getOrgScopedDb(session.orgId);

  const title = (formData.get("title") as string | null)?.trim();
  if (!title) return { ok: false, error: "Title is required." };
  const description = (formData.get("description") as string | null)?.trim() || undefined;

  const today = startOfToday();

  const task = await db.warehouseTask.create({
    data: { orgId: session.orgId, title, description, recurrence: "ONCE" },
  });
  await db.warehouseTaskOccurrence.create({
    data: { orgId: session.orgId, taskId: task.id, originalDate: today, scheduledDate: today },
  });

  revalidatePath("/warehouse");
  return { ok: true };
}

export async function toggleWarehouseTaskActive(taskId: string, active: boolean): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.warehouseTask.update({ where: { id: taskId }, data: { active } });

  revalidatePath("/admin/warehouse-tasks");
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function completeWarehouseTask(occurrenceId: string): Promise<void> {
  const session = await assertRole(["WAREHOUSE"]);
  const db = getOrgScopedDb(session.orgId);

  await db.warehouseTaskOccurrence.update({
    where: { id: occurrenceId },
    data: { completed: true, completedAt: new Date(), completedById: session.userId as string },
  });

  revalidatePath("/warehouse");
}

/**
 * Simple yes/no daily attendance for warehouse staff, reusing the shared
 * Attendance model: "no" records an ABSENT row (and immediately rolls
 * today's open tasks to tomorrow); "yes" just clears any ABSENT row so the
 * day reads as worked, matching how salesman attendance already treats "no
 * row" as a normal working day.
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
    await shiftTodaysTasksToTomorrow(session.orgId);
  }

  revalidatePath("/warehouse");
}
