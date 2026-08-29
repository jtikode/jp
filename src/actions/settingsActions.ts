"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/permissions";

export async function updateUpiSettings(
  _prevState: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await assertRole(["ADMIN"]);

  const upiVpa = (formData.get("upiVpa") as string | null)?.trim() || undefined;
  const upiPayeeName = (formData.get("upiPayeeName") as string | null)?.trim() || undefined;

  // Organization isn't a tenant-scoped model (it IS the tenant), so this
  // updates it directly by id rather than through getOrgScopedDb.
  await db.organization.update({
    where: { id: session.orgId },
    data: { upiVpa, upiPayeeName },
  });

  revalidatePath("/team/admin/settings");
  revalidatePath("/shop/pay-online");
  return { ok: true };
}
