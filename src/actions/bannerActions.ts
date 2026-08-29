"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { uploadPhoto } from "@/lib/blob";
import { sendPushToOrg } from "@/lib/webPush";
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
  const expiresAtRaw = formData.get("expiresAt") as string | null;
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : undefined;
  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    return { ok: false, error: "The flash deal's end time must be in the future." };
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const imageUrl = await uploadPhoto(`banner-${Date.now()}-${image.name}`, buffer, image.type);

  await db.shopBanner.create({
    data: { orgId: session.orgId, placement, imageUrl, title, linkUrl, sortOrder, expiresAt },
  });

  revalidatePath("/team/admin/banners");
  revalidatePath("/shop/home");
  revalidatePath("/shop/offers");

  // Only a genuinely time-boxed banner (expiresAt set) is worth interrupting
  // every retailer for — an ordinary evergreen banner doesn't push.
  if (expiresAt) {
    sendPushToOrg(session.orgId, {
      title: "⚡ Flash Deal",
      body: title ? `${title} — limited time only!` : "A limited-time deal just went live.",
      url: "/shop/offers",
    }).catch(() => {});
  }

  return { ok: true };
}

export async function toggleBannerActive(bannerId: string, active: boolean): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.shopBanner.update({ where: { id: bannerId }, data: { active } });

  revalidatePath("/team/admin/banners");
  revalidatePath("/shop/home");
  revalidatePath("/shop/offers");
}
