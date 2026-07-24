"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";
import { createEmployeeSchema } from "@/lib/validators";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createEmployee(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await assertRole(["ADMIN"]);

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

  const existing = await db.user.findUnique({ where: { username: parsed.data.username } });
  if (existing) {
    return { ok: false, error: "That username is already taken." };
  }

  await db.user.create({
    data: {
      username: parsed.data.username,
      passwordHash: await hashPassword(parsed.data.password),
      name: parsed.data.name,
      role: parsed.data.role,
      phone: parsed.data.phone,
    },
  });

  revalidatePath("/admin/employees");
  return { ok: true };
}

export async function toggleEmployeeActive(userId: string, active: boolean): Promise<void> {
  await assertRole(["ADMIN"]);

  await db.user.update({ where: { id: userId }, data: { active } });

  revalidatePath("/admin/employees");
}
