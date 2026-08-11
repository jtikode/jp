"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";

export async function createLoyaltyTier(
  _prevState: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const thresholdRaw = formData.get("thresholdAmount") as string | null;
  const thresholdAmount = thresholdRaw ? Number(thresholdRaw) : NaN;
  const rewardText = (formData.get("rewardText") as string | null)?.trim();
  const sortOrderRaw = formData.get("sortOrder") as string | null;
  const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : 0;

  if (!thresholdRaw || Number.isNaN(thresholdAmount) || thresholdAmount < 0) {
    return { ok: false, error: "A valid spend threshold is required." };
  }
  if (!rewardText) {
    return { ok: false, error: "Reward text is required." };
  }

  await db.loyaltyTier.create({
    data: { orgId: session.orgId, thresholdAmount, rewardText, sortOrder },
  });

  revalidatePath("/admin/loyalty-tiers");
  revalidatePath("/shop/home");
  return { ok: true };
}

export async function toggleLoyaltyTierActive(tierId: string, active: boolean): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.loyaltyTier.update({ where: { id: tierId }, data: { active } });

  revalidatePath("/admin/loyalty-tiers");
  revalidatePath("/shop/home");
}
