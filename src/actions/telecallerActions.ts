"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { telecallerLogSchema } from "@/lib/validators";
import type { ActionResult } from "@/actions/employeeActions";

export async function logTelecallerContact(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertRole(["TELECALLER"]);
  const db = getOrgScopedDb(session.orgId);

  const parsed = telecallerLogSchema.safeParse({
    storeId: formData.get("storeId"),
    orderAmount: formData.get("orderAmount"),
    paymentPromise: formData.get("paymentPromise"),
    collectionAmount: formData.get("collectionAmount"),
    hasOrder: formData.get("hasOrder"),
    noOrderReason: formData.get("noOrderReason"),
    noPaymentReason: formData.get("noPaymentReason"),
    complaintNotes: formData.get("complaintNotes"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the details." };
  }

  await db.telecallerLog.create({
    data: {
      orgId: session.orgId,
      userId: session.userId as string,
      storeId: parsed.data.storeId,
      orderAmount: parsed.data.orderAmount,
      paymentPromise: parsed.data.paymentPromise,
      collectionAmount: parsed.data.collectionAmount,
      hasOrder: parsed.data.hasOrder,
      noOrderReason: parsed.data.hasOrder ? undefined : parsed.data.noOrderReason,
      noPaymentReason: parsed.data.noPaymentReason,
      complaintNotes: parsed.data.complaintNotes,
    },
  });

  redirect("/team/telecaller/dashboard?logged=1");
}

/** Adds a missing phone number, or corrects the store's phone/contact-person name. */
export async function updateStoreContact(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertRole(["TELECALLER", "ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const storeId = formData.get("storeId") as string | null;
  if (!storeId) return { ok: false, error: "Missing store." };

  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const contactPersonName = (formData.get("contactPersonName") as string | null)?.trim() || null;

  if (phone && !/^[\d+\-\s()]{6,20}$/.test(phone)) {
    return { ok: false, error: "That doesn't look like a valid phone number." };
  }

  await db.store.update({ where: { id: storeId }, data: { phone, contactPersonName } });

  revalidatePath(`/team/telecaller/stores/${storeId}`);
  return { ok: true };
}

/** Assigns (or reassigns) which day of the week a route gets called on. */
export async function assignRouteCallDay(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertRole(["TELECALLER"]);
  const db = getOrgScopedDb(session.orgId);

  const routeId = formData.get("routeId") as string | null;
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  if (!routeId || Number.isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return { ok: false, error: "Choose a route and a day." };
  }

  await db.telecallerCallSchedule.upsert({
    where: { routeId },
    update: { dayOfWeek },
    create: { orgId: session.orgId, routeId, dayOfWeek },
  });

  revalidatePath("/team/telecaller/calendar");
  return { ok: true };
}

export async function removeRouteCallDay(routeId: string): Promise<void> {
  const session = await assertRole(["TELECALLER"]);
  const db = getOrgScopedDb(session.orgId);

  await db.telecallerCallSchedule.deleteMany({ where: { routeId } });

  revalidatePath("/team/telecaller/calendar");
}
