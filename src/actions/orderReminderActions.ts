"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertStoreSession } from "@/lib/retailerPermissions";

export interface SetOrderReminderState {
  ok: boolean;
  error?: string;
}

export async function setOrderReminder(
  _prev: SetOrderReminderState | null,
  formData: FormData,
): Promise<SetOrderReminderState> {
  const session = await assertStoreSession();
  const db = getOrgScopedDb(session.orgId);

  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const time = String(formData.get("time") ?? "");
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return { ok: false, error: "Pick a day of the week." };
  }
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    return { ok: false, error: "Pick a valid time." };
  }

  await db.orderReminder.upsert({
    where: { storeId: session.storeId },
    update: { dayOfWeek, hour, minute, active: true },
    create: { orgId: session.orgId, storeId: session.storeId, dayOfWeek, hour, minute, active: true },
  });

  revalidatePath("/shop/order-reminder");
  return { ok: true };
}

export async function disableOrderReminder(): Promise<void> {
  const session = await assertStoreSession();
  const db = getOrgScopedDb(session.orgId);

  await db.orderReminder.updateMany({
    where: { storeId: session.storeId },
    data: { active: false },
  });

  revalidatePath("/shop/order-reminder");
}
