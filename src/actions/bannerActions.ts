"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { uploadPhoto } from "@/lib/blob";
import type { BannerPlacement } from "@/generated/prisma/client";

export async function createBanner(
  _prevState: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const placement = formData.get("placement") as BannerPlacement | null;
  if (placement !== "HERO" && placement !== "OFFER") {
    return { ok: false, error: "Choose where this banner should appear." };
  }

  const image = formData.get("image") as File | null;
  if (!image || image.size === 0) {
    return { ok: false, error: "A banner image is required." };
  }

  const title = (formData.get("title") as string | null)?.trim() || undefined;
  const linkUrl = (formData.get("linkUrl") as string | null)?.trim() || undefined;
  const sortOrderRaw = formData.get("sortOrder") as string | null;
  const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : 0;

  const buffer = Buffer.from(await image.arrayBuffer());
  const imageUrl = await uploadPhoto(`banner-${Date.now()}-${image.name}`, buffer, image.type);

  await db.shopBanner.create({
    data: { orgId: session.orgId, placement, imageUrl, title, linkUrl, sortOrder },
  });

  revalidatePath("/admin/banners");
  revalidatePath("/shop/home");
  revalidatePath("/shop/offers");
  return { ok: true };
}

export async function toggleBannerActive(bannerId: string, active: boolean): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.shopBanner.update({ where: { id: bannerId }, data: { active } });

  revalidatePath("/admin/banners");
  revalidatePath("/shop/home");
  revalidatePath("/shop/offers");
}
