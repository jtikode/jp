"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { z } from "zod";
import type { ActionResult } from "@/actions/employeeActions";

const targetSchema = z.object({
  userId: z.string().min(1),
  periodMonth: z.coerce.number().int().min(1).max(12),
  periodYear: z.coerce.number().int().min(2020).max(2100),
  monthlyTarget: z.coerce.number().min(0),
  todayTarget: z.coerce.number().min(0),
  perRetailerTarget: z.coerce.number().min(0),
});

export async function setTarget(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const parsed = targetSchema.safeParse({
    userId: formData.get("userId"),
    periodMonth: formData.get("periodMonth"),
    periodYear: formData.get("periodYear"),
    monthlyTarget: formData.get("monthlyTarget"),
    todayTarget: formData.get("todayTarget"),
    perRetailerTarget: formData.get("perRetailerTarget"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the target values." };
  }

  const { userId, periodMonth, periodYear, ...amounts } = parsed.data;

  await db.target.upsert({
    where: { userId_periodMonth_periodYear: { userId, periodMonth, periodYear } },
    update: amounts,
    create: { orgId: session.orgId, userId, periodMonth, periodYear, ...amounts },
  });

  revalidatePath(`/team/admin/employees/${userId}/targets`);
  return { ok: true };
}
