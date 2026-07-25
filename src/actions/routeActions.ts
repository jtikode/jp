"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/permissions";
import { createRouteSchema, assignRouteSchema } from "@/lib/validators";
import type { ActionResult } from "@/actions/employeeActions";

export async function createRoute(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await assertRole(["ADMIN"]);

  const parsed = createRouteSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await db.route.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return { ok: false, error: "A route with that name already exists." };
  }

  await db.route.create({ data: parsed.data });

  revalidatePath("/admin/routes");
  return { ok: true };
}

export async function assignRoute(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await assertRole(["ADMIN"]);

  const parsed = assignRouteSchema.safeParse({
    userId: formData.get("userId"),
    routeId: formData.get("routeId"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Please choose both an employee and a route." };
  }

  const existing = await db.routeAssignment.findUnique({
    where: { userId_routeId: parsed.data },
  });
  if (existing) {
    return { ok: false, error: "That employee is already assigned to this route." };
  }

  await db.routeAssignment.create({ data: parsed.data });

  revalidatePath("/admin/routes");
  return { ok: true };
}

export async function unassignRoute(assignmentId: string): Promise<void> {
  await assertRole(["ADMIN"]);

  await db.routeAssignment.delete({ where: { id: assignmentId } });

  revalidatePath("/admin/routes");
}

export async function deleteRoute(routeId: string): Promise<ActionResult> {
  await assertRole(["ADMIN"]);

  // Detach rather than cascade-delete: store master data and past visit
  // history stay intact, just no longer tied to this (now gone) route.
  await db.$transaction([
    db.visit.updateMany({ where: { routeId }, data: { routeId: null } }),
    db.store.updateMany({ where: { routeId }, data: { routeId: null, visitSequence: null } }),
    db.routeStore.deleteMany({ where: { routeId } }),
    db.routeAssignment.deleteMany({ where: { routeId } }),
    db.route.delete({ where: { id: routeId } }),
  ]);

  revalidatePath("/admin/routes");
  revalidatePath("/admin/stores");
  return { ok: true };
}
