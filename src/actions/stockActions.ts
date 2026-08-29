"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { parseSpreadsheet, findColumn } from "@/lib/csv";

const STOCK_ITEM_ALIASES = {
  company: ["company", "company name", "manufacturer", "brand"],
  name: ["item", "item name", "product", "product name"],
};

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function upsertStockCount(stockItemId: string, quantity: number): Promise<void> {
  const session = await assertRole(["WAREHOUSE"]);
  const db = getOrgScopedDb(session.orgId);
  const date = startOfToday();

  await db.stockCount.upsert({
    where: { stockItemId_date: { stockItemId, date } },
    update: { quantity, recordedById: session.userId as string },
    create: { orgId: session.orgId, stockItemId, date, quantity, recordedById: session.userId as string },
  });

  revalidatePath("/team/warehouse/stock");
}

export async function addStockItem(
  _prevState: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { ok: false, error: "Item name is required." };

  const existing = await db.stockItem.findFirst({ where: { name } });
  if (existing) return { ok: false, error: "That item already exists." };

  await db.stockItem.create({ data: { orgId: session.orgId, name } });

  revalidatePath("/team/admin/warehouse-tasks");
  revalidatePath("/team/warehouse/stock");
  return { ok: true };
}

export async function importStockItems(
  _prevState: { ok: boolean; error?: string; rowCount?: number } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; rowCount?: number }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a file to upload." };
  }

  const buffer = await file.arrayBuffer();
  const rows = parseSpreadsheet(file.name, buffer);

  const parsedRows: Array<{ name: string; company?: string }> = [];
  for (const row of rows) {
    const name = findColumn(row, STOCK_ITEM_ALIASES.name);
    if (!name) continue;
    const company = findColumn(row, STOCK_ITEM_ALIASES.company);
    parsedRows.push({ name, company });
  }

  if (parsedRows.length === 0) {
    return { ok: false, error: "No item rows could be read from that file." };
  }

  const batch = await db.importBatch.create({
    data: {
      orgId: session.orgId,
      importType: "STOCK_ITEMS",
      fileName: file.name,
      rowCount: 0,
      uploadedById: session.userId as string,
    },
  });

  let imported = 0;
  for (const row of parsedRows) {
    await db.stockItem.upsert({
      where: { orgId_name: { orgId: session.orgId, name: row.name } },
      update: { company: row.company, active: true },
      create: { orgId: session.orgId, name: row.name, company: row.company },
    });
    imported += 1;
  }

  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: imported } });

  revalidatePath("/team/admin/warehouse-tasks");
  revalidatePath("/team/warehouse/stock");
  return { ok: true, rowCount: imported };
}

export async function deleteStockItem(stockItemId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.stockCount.deleteMany({ where: { stockItemId } });
  await db.stockItem.delete({ where: { id: stockItemId } });

  revalidatePath("/team/admin/warehouse-tasks");
  revalidatePath("/team/warehouse/stock");
  return { ok: true };
}
