"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { uploadPhoto } from "@/lib/blob";
import { sendPushToOrg, isWebPushConfigured } from "@/lib/webPush";
import { Prisma, type BannerPlacement } from "@/generated/prisma/client";
import { parseBundleItems, MAX_BUNDLE_ITEMS, type BundleItem } from "@/lib/bannerBundle";

type OrgDb = ReturnType<typeof getOrgScopedDb>;

function toJson(items: BundleItem[]): Prisma.InputJsonArray {
  return items.map(({ productId, quantity, freeQty }) => ({ productId, quantity, freeQty }));
}

// Strict check of the admin's cart-items JSON: every entry must be well formed
// and point at a real, active product. Empty input means "no bundle".
async function validateBundleInput(
  db: OrgDb,
  raw: string | null | undefined,
): Promise<{ ok: true; items: BundleItem[] | null } | { ok: false; error: string }> {
  const text = raw?.trim();
  if (!text) return { ok: true, items: null };

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    return { ok: false, error: "The cart items could not be read. Please re-add them." };
  }
  if (!Array.isArray(parsedJson)) return { ok: false, error: "The cart items could not be read." };
  if (parsedJson.length === 0) return { ok: true, items: null };
  if (parsedJson.length > MAX_BUNDLE_ITEMS) {
    return { ok: false, error: `An offer can add at most ${MAX_BUNDLE_ITEMS} different products.` };
  }

  const items = parseBundleItems(parsedJson);
  if (items.length !== parsedJson.length) {
    return {
      ok: false,
      error: "Each cart item needs a unique product, a whole quantity of at least 1, and free units no higher than the quantity.",
    };
  }

  const found = await db.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, active: true },
    select: { id: true },
  });
  if (found.length !== items.length) {
    return { ok: false, error: "One of the selected products is no longer available. Please re-add it." };
  }
  return { ok: true, items };
}

export interface BannerProductHit {
  id: string;
  name: string;
  company: string | null;
  price: number;
  stock: number | null;
}

// Product picker for the admin's offer editor.
export async function searchBannerProducts(query: string): Promise<BannerProductHit[]> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const q = query.trim();
  if (q.length < 2) return [];

  const products = await db.product.findMany({
    where: { active: true, name: { contains: q, mode: "insensitive" } },
    select: { id: true, name: true, company: true, price: true, stock: true },
    orderBy: { name: "asc" },
    take: 15,
  });
  return products.map((p) => ({ ...p, price: Number(p.price) }));
}

const MAX_REMARK_LENGTH = 200;

function cleanRemark(raw: string | null | undefined): { ok: true; remark: string | null } | { ok: false; error: string } {
  const remark = raw?.trim().replace(/\s+/g, " ") ?? "";
  if (remark.length > MAX_REMARK_LENGTH) {
    return { ok: false, error: `The remark can be at most ${MAX_REMARK_LENGTH} characters.` };
  }
  return { ok: true, remark: remark || null };
}

export async function updateBannerCartItems(
  bannerId: string,
  cartItemsJson: string,
  cartRemark: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const bundle = await validateBundleInput(db, cartItemsJson);
  if (!bundle.ok) return { ok: false, error: bundle.error };
  const remark = cleanRemark(cartRemark);
  if (!remark.ok) return { ok: false, error: remark.error };

  await db.shopBanner.update({
    where: { id: bannerId },
    data: {
      cartItems: bundle.items ? toJson(bundle.items) : Prisma.DbNull,
      cartRemark: bundle.items ? remark.remark : null,
    },
  });

  revalidatePath("/team/admin/banners");
  revalidatePath("/shop/home");
  revalidatePath("/shop/offers");
  return { ok: true };
}

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

  const bundle = await validateBundleInput(db, formData.get("cartItems") as string | null);
  if (!bundle.ok) return { ok: false, error: bundle.error };
  const remark = cleanRemark(formData.get("cartRemark") as string | null);
  if (!remark.ok) return { ok: false, error: remark.error };

  const buffer = Buffer.from(await image.arrayBuffer());
  const imageUrl = await uploadPhoto(`banner-${Date.now()}-${image.name}`, buffer, image.type);

  await db.shopBanner.create({
    data: {
      orgId: session.orgId,
      placement,
      imageUrl,
      title,
      linkUrl,
      sortOrder,
      expiresAt,
      cartItems: bundle.items ? toJson(bundle.items) : undefined,
      cartRemark: bundle.items ? remark.remark : null,
    },
  });

  revalidatePath("/team/admin/banners");
  revalidatePath("/shop/home");
  revalidatePath("/shop/offers");

  // Only a genuinely time-boxed banner (expiresAt set) is worth interrupting
  // every retailer for — an ordinary evergreen banner doesn't push.
  if (expiresAt) {
    sendPushToOrg(session.orgId, {
      title: "⚡ Flash Deal",
      body: title ? `${title}, limited time only!` : "A limited-time deal just went live.",
      url: "/shop/offers",
    }).catch(() => {});
  }

  return { ok: true };
}

export interface SendNotificationState {
  ok: boolean;
  error?: string;
  sentCount?: number;
  storeCount?: number;
  scheduled?: boolean;
  scheduledAt?: string;
}

export async function sendAnnouncementNotification(
  _prevState: SendNotificationState | null,
  formData: FormData,
): Promise<SendNotificationState> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const title = (formData.get("title") as string | null)?.trim();
  const body = (formData.get("body") as string | null)?.trim();
  const url = (formData.get("url") as string | null)?.trim() || undefined;
  const sendAtRaw = (formData.get("sendAt") as string | null)?.trim();

  if (!title || !body) {
    return { ok: false, error: "Title and message are both required." };
  }
  if (!isWebPushConfigured()) {
    return { ok: false, error: "Push notifications aren't configured on this server." };
  }

  // No date/time given, or one already in the past — send immediately, same
  // as before scheduling existed.
  const sendAt = sendAtRaw ? new Date(sendAtRaw) : undefined;
  if (!sendAt || sendAt.getTime() <= Date.now()) {
    const { sentCount, storeCount } = await sendPushToOrg(session.orgId, { title, body, url });
    return { ok: true, sentCount, storeCount };
  }

  await db.scheduledNotification.create({
    data: { orgId: session.orgId, title, body, url, scheduledAt: sendAt, createdById: session.userId },
  });

  revalidatePath("/team/admin/banners");
  return { ok: true, scheduled: true, scheduledAt: sendAt.toISOString() };
}

export async function cancelScheduledNotification(id: string): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.scheduledNotification.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/team/admin/banners");
}

export async function toggleBannerActive(bannerId: string, active: boolean): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.shopBanner.update({ where: { id: bannerId }, data: { active } });

  revalidatePath("/team/admin/banners");
  revalidatePath("/shop/home");
  revalidatePath("/shop/offers");
}
