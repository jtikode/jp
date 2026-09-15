"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { getStartOfIstDayUtc } from "@/lib/istTime";
import type { AttendanceStatus } from "@/generated/prisma/client";

export async function markAttendance(
  status: AttendanceStatus,
  routeId?: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await assertRole(["SALESMAN"]);
  const db = getOrgScopedDb(session.orgId);

  const date = getStartOfIstDayUtc();
  const userId = session.userId as string;

  await db.attendance.upsert({
    where: { userId_date: { userId, date } },
    update: { status, routeId: status === "ON_ROUTE" ? routeId : null },
    create: { orgId: session.orgId, userId, date, status, routeId: status === "ON_ROUTE" ? routeId : undefined },
  });

  revalidatePath("/team/salesman/dashboard");
  revalidatePath("/team/salesman/calendar");
  return { ok: true };
}
