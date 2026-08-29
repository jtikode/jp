"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";
import { createEmployeeSchema } from "@/lib/validators";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createEmployee(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const parsed = createEmployeeSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    name: formData.get("name"),
    role: formData.get("role"),
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await db.user.findFirst({ where: { username: parsed.data.username } });
  if (existing) {
    return { ok: false, error: "That username is already taken." };
  }

  await db.user.create({
    data: {
      orgId: session.orgId,
      username: parsed.data.username,
      passwordHash: await hashPassword(parsed.data.password),
      name: parsed.data.name,
      role: parsed.data.role,
      phone: parsed.data.phone,
    },
  });

  revalidatePath("/team/admin/employees");
  return { ok: true };
}

export async function toggleEmployeeActive(userId: string, active: boolean): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.user.update({ where: { id: userId }, data: { active } });

  revalidatePath("/team/admin/employees");
}

export async function deleteEmployee(userId: string): Promise<ActionResult> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const [visits, attendances, telecallerLogs, stockCounts] = await Promise.all([
    db.visit.count({ where: { userId } }),
    db.attendance.count({ where: { userId } }),
    db.telecallerLog.count({ where: { userId } }),
    db.stockCount.count({ where: { recordedById: userId } }),
  ]);

  if (visits + attendances + telecallerLogs + stockCounts > 0) {
    return {
      ok: false,
      error: "This employee has logged activity — deactivate them instead of deleting.",
    };
  }

  await db.$transaction([
    db.routeAssignment.deleteMany({ where: { userId } }),
    db.target.deleteMany({ where: { userId } }),
    db.user.delete({ where: { id: userId } }),
  ]);

  revalidatePath("/team/admin/employees");
  return { ok: true };
}
