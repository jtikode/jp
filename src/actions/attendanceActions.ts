"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/permissions";
import type { AttendanceStatus } from "@/generated/prisma/client";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function markAttendance(status: AttendanceStatus): Promise<{ ok: boolean; error?: string }> {
  const session = await assertRole(["SALESMAN"]);

  const date = startOfToday();

  await db.attendance.upsert({
    where: { userId_date: { userId: session.userId as string, date } },
    update: { status },
    create: { userId: session.userId as string, date, status },
  });

  revalidatePath("/salesman/routes");
  revalidatePath("/salesman/calendar");
  return { ok: true };
}
