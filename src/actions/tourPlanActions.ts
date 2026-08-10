"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import type { AttendanceStatus } from "@/generated/prisma/client";

const PRESERVED_STATUSES: AttendanceStatus[] = ["LEAVE", "ABSENT", "HALF_LEAVE", "HOLIDAY_WEEKOFF"];

export interface TourPlanEntry {
  date: string; // yyyy-MM-dd
  routeId?: string;
  workingWithUserId?: string;
  remark?: string;
}

/**
 * Bulk-saves a whole month's plan at once. Never overwrites a day already
 * marked Leave/Absent/Half-Leave/Holiday via the daily attendance buttons —
 * those represent a confirmed absence, and the tour plan is just a forward
 * plan for working days.
 */
export async function saveTourPlan(entries: TourPlanEntry[]): Promise<{ ok: boolean; error?: string }> {
  const session = await assertRole(["SALESMAN"]);
  const db = getOrgScopedDb(session.orgId);
  const userId = session.userId as string;

  for (const entry of entries) {
    if (!entry.routeId && !entry.workingWithUserId && !entry.remark) continue;

    const date = new Date(`${entry.date}T00:00:00`);
    const existing = await db.attendance.findUnique({ where: { userId_date: { userId, date } } });

    const preserveStatus = existing && PRESERVED_STATUSES.includes(existing.status);
    const status: AttendanceStatus = preserveStatus
      ? existing!.status
      : entry.routeId
        ? "ON_ROUTE"
        : (existing?.status ?? "OFFICE_DAY");

    await db.attendance.upsert({
      where: { userId_date: { userId, date } },
      update: {
        status,
        routeId: entry.routeId ?? existing?.routeId ?? null,
        workingWithUserId: entry.workingWithUserId ?? null,
        note: entry.remark ?? null,
      },
      create: {
        orgId: session.orgId,
        userId,
        date,
        status,
        routeId: entry.routeId ?? null,
        workingWithUserId: entry.workingWithUserId ?? null,
        note: entry.remark ?? null,
      },
    });
  }

  revalidatePath("/salesman/tour-plan");
  revalidatePath("/salesman/dashboard");
  revalidatePath("/salesman/calendar");
  return { ok: true };
}
