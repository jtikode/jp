"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/permissions";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function upsertStockCount(stockItemId: string, quantity: number): Promise<void> {
  const session = await assertRole(["WAREHOUSE"]);
  const date = startOfToday();

  await db.stockCount.upsert({
    where: { stockItemId_date: { stockItemId, date } },
    update: { quantity, recordedById: session.userId as string },
    create: { stockItemId, date, quantity, recordedById: session.userId as string },
  });

  revalidatePath("/warehouse/stock");
}

export async function addStockItem(
  _prevState: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await assertRole(["ADMIN"]);

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { ok: false, error: "Item name is required." };

  const existing = await db.stockItem.findUnique({ where: { name } });
  if (existing) return { ok: false, error: "That item already exists." };

  await db.stockItem.create({ data: { name } });

  revalidatePath("/admin/warehouse-tasks");
  revalidatePath("/warehouse/stock");
  return { ok: true };
}

export async function deleteStockItem(stockItemId: string): Promise<{ ok: boolean; error?: string }> {
  await assertRole(["ADMIN"]);

  await db.stockCount.deleteMany({ where: { stockItemId } });
  await db.stockItem.delete({ where: { id: stockItemId } });

  revalidatePath("/admin/warehouse-tasks");
  revalidatePath("/warehouse/stock");
  return { ok: true };
}
