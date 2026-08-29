"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { uploadPhoto } from "@/lib/blob";
import { visitSchema } from "@/lib/validators";
import type { ActionResult } from "@/actions/employeeActions";

const MAX_DISTANCE_METERS = 100;
const EARTH_RADIUS_METERS = 6371000;

/** Great-circle distance between two lat/lng points, in meters. */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export async function submitVisit(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertRole(["SALESMAN"]);
  const db = getOrgScopedDb(session.orgId);

  const parsed = visitSchema.safeParse({
    storeId: formData.get("storeId"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    collectionAmount: formData.get("collectionAmount"),
    orderAmount: formData.get("orderAmount"),
    hasOrder: formData.get("hasOrder"),
    hasDiscount: formData.get("hasDiscount"),
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

  // Once a store's location is known (from its first confirmed visit), every
  // later visit must be within range of it — catches the wrong-store mixups
  // that free-text/manual entry allowed.
  if (store.latitude != null && store.longitude != null) {
    const distance = haversineMeters(
      store.latitude,
      store.longitude,
      parsed.data.latitude,
      parsed.data.longitude,
    );
    if (distance > MAX_DISTANCE_METERS) {
      return {
        ok: false,
        error: `You can mark visit only within ${MAX_DISTANCE_METERS} meters from first visit location. Current distance: ${distance.toFixed(2)} meters`,
      };
    }
  }

  const buffer = Buffer.from(await photo.arrayBuffer());
  const photoUrl = await uploadPhoto(`visit-${Date.now()}-${photo.name}`, buffer, photo.type);

  await db.visit.create({
    data: {
      orgId: session.orgId,
      userId: session.userId as string,
      storeId: store.id,
      routeId: store.routeId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      photoUrl,
      collectionAmount: parsed.data.collectionAmount,
      orderAmount: parsed.data.orderAmount,
      hasOrder: parsed.data.hasOrder,
      hasDiscount: parsed.data.hasDiscount,
      noOrderReason: parsed.data.hasOrder ? undefined : parsed.data.noOrderReason,
      notes: parsed.data.notes,
    },
  });

  // First confirmed GPS fix for this store becomes its known location, so any
  // salesman covering this route later can see it's already been found.
  if (store.latitude == null || store.longitude == null) {
    await db.store.update({
      where: { id: store.id },
      data: { latitude: parsed.data.latitude, longitude: parsed.data.longitude },
    });
  }

  revalidatePath("/team/salesman/calendar");
  revalidatePath(`/team/salesman/routes/${store.routeId}`);
  revalidatePath("/team/salesman/stores");
  redirect("/team/salesman/stores?visitSubmitted=1");
}
