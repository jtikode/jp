"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/permissions";
import { uploadPhoto } from "@/lib/blob";
import { visitSchema } from "@/lib/validators";
import type { ActionResult } from "@/actions/employeeActions";

export async function submitVisit(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertRole(["SALESMAN"]);

  const parsed = visitSchema.safeParse({
    storeId: formData.get("storeId"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    collectionAmount: formData.get("collectionAmount"),
    orderAmount: formData.get("orderAmount"),
    hasOrder: formData.get("hasOrder"),
    noOrderReason: formData.get("noOrderReason"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the visit details." };
  }

  const photo = formData.get("photo") as File | null;
  if (!photo || photo.size === 0) {
    return { ok: false, error: "A photo is required to submit a visit." };
  }

  const store = await db.store.findUnique({ where: { id: parsed.data.storeId } });
  if (!store) {
    return { ok: false, error: "Store not found." };
  }

  const buffer = Buffer.from(await photo.arrayBuffer());
  const photoUrl = await uploadPhoto(`visit-${Date.now()}-${photo.name}`, buffer, photo.type);

  await db.visit.create({
    data: {
      userId: session.userId as string,
      storeId: store.id,
      routeId: store.routeId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      photoUrl,
      collectionAmount: parsed.data.collectionAmount,
      orderAmount: parsed.data.orderAmount,
      hasOrder: parsed.data.hasOrder,
      noOrderReason: parsed.data.hasOrder ? undefined : parsed.data.noOrderReason,
      notes: parsed.data.notes,
    },
  });

  revalidatePath("/salesman/calendar");
  redirect("/salesman/stores?visitSubmitted=1");
}
