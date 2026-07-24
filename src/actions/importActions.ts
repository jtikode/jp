"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/permissions";
import { parseSpreadsheet, findColumn } from "@/lib/csv";
import type { ActionResult } from "@/actions/employeeActions";

const STORE_ALIASES = {
  code: ["code", "store code", "id", "store id"],
  name: ["name", "store name", "medical store", "chemist name", "ledger"],
  address: ["address", "store address"],
  addressParts: ["address1", "address2", "address3"],
  phone: ["phone", "mobile", "contact", "phone number", "phone1", "phone2"],
  route: ["route", "route name", "beat", "beat name", "rout", "area"],
};

/**
 * Some billing-software exports (e.g. Tally ledger exports) split the
 * address across address1/address2/address3 instead of one column.
 */
function findAddress(row: Record<string, string>): string | undefined {
  const single = findColumn(row, STORE_ALIASES.address);
  if (single) return single;

  const parts = STORE_ALIASES.addressParts
    .map((alias) => findColumn(row, [alias]))
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : undefined;
}

export async function importStoreMaster(
  _prevState: (ActionResult & { rowCount?: number }) | null,
  formData: FormData,
): Promise<ActionResult & { rowCount?: number }> {
  const session = await assertRole(["ADMIN"]);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a file to upload." };
  }

  const buffer = await file.arrayBuffer();
  const rows = parseSpreadsheet(file.name, buffer);

  if (rows.length === 0) {
    return { ok: false, error: "No rows found in that file." };
  }

  const routeCache = new Map<string, string>();
  let imported = 0;

  for (const row of rows) {
    const name = findColumn(row, STORE_ALIASES.name);
    const address = findAddress(row);
    if (!name || !address) continue;

    const code = findColumn(row, STORE_ALIASES.code);
    const phone = findColumn(row, STORE_ALIASES.phone);
    const routeName = findColumn(row, STORE_ALIASES.route);

    let routeId: string | undefined;
    if (routeName) {
      if (!routeCache.has(routeName)) {
        const route = await db.route.upsert({
          where: { name: routeName },
          update: {},
          create: { name: routeName },
        });
        routeCache.set(routeName, route.id);
      }
      routeId = routeCache.get(routeName);
    }

    if (code) {
      await db.store.upsert({
        where: { externalCode: code },
        update: { name, address, phone, routeId },
        create: { externalCode: code, name, address, phone, routeId },
      });
    } else {
      await db.store.create({ data: { name, address, phone, routeId } });
    }

    imported += 1;
  }

  await db.importBatch.create({
    data: {
      importType: "STORE_MASTER",
      fileName: file.name,
      rowCount: imported,
      uploadedById: session.userId as string,
    },
  });

  revalidatePath("/admin/imports");
  revalidatePath("/admin/routes");
  return { ok: true, rowCount: imported };
}

const LEDGER_ALIASES = {
  code: ["code", "store code", "id", "store id"],
  invoiceNo: ["invoice no", "invoice number", "invoice"],
  invoiceDate: ["invoice date", "date"],
  amount: ["amount", "bill amount", "invoice amount"],
  outstandingAmount: ["outstanding", "outstanding amount", "due amount", "balance"],
  dueDate: ["due date"],
};

export async function importLedger(
  _prevState: (ActionResult & { rowCount?: number }) | null,
  formData: FormData,
): Promise<ActionResult & { rowCount?: number }> {
  const session = await assertRole(["ADMIN"]);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a file to upload." };
  }

  const buffer = await file.arrayBuffer();
  const rows = parseSpreadsheet(file.name, buffer);
  if (rows.length === 0) {
    return { ok: false, error: "No rows found in that file." };
  }

  const batch = await db.importBatch.create({
    data: { importType: "LEDGER", fileName: file.name, rowCount: 0, uploadedById: session.userId as string },
  });

  const storeCache = new Map<string, string | null>();
  let imported = 0;

  for (const row of rows) {
    const code = findColumn(row, LEDGER_ALIASES.code);
    const outstandingRaw = findColumn(row, LEDGER_ALIASES.outstandingAmount);
    if (!code || outstandingRaw === undefined) continue;

    if (!storeCache.has(code)) {
      const store = await db.store.findUnique({ where: { externalCode: code } });
      storeCache.set(code, store?.id ?? null);
    }
    const storeId = storeCache.get(code);
    if (!storeId) continue; // no matching store for this code — skip

    const amountRaw = findColumn(row, LEDGER_ALIASES.amount);
    const invoiceNo = findColumn(row, LEDGER_ALIASES.invoiceNo);
    const invoiceDateRaw = findColumn(row, LEDGER_ALIASES.invoiceDate);
    const dueDateRaw = findColumn(row, LEDGER_ALIASES.dueDate);

    await db.ledgerEntry.create({
      data: {
        storeId,
        invoiceNo,
        invoiceDate: invoiceDateRaw ? new Date(invoiceDateRaw) : undefined,
        amount: amountRaw ? Number(amountRaw) : Number(outstandingRaw),
        outstandingAmount: Number(outstandingRaw),
        dueDate: dueDateRaw ? new Date(dueDateRaw) : undefined,
        uploadBatchId: batch.id,
      },
    });

    imported += 1;
  }

  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: imported } });

  revalidatePath("/admin/imports");
  revalidatePath("/admin/ledger");
  return { ok: true, rowCount: imported };
}

const PURCHASE_HISTORY_ALIASES = {
  code: ["code", "store code", "id", "store id"],
  itemName: ["item", "item name", "product", "product name"],
  quantity: ["quantity", "qty"],
  unit: ["unit", "uom"],
  periodStart: ["period start", "from"],
  periodEnd: ["period end", "to"],
};

export async function importPurchaseHistory(
  _prevState: (ActionResult & { rowCount?: number }) | null,
  formData: FormData,
): Promise<ActionResult & { rowCount?: number }> {
  const session = await assertRole(["ADMIN"]);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a file to upload." };
  }

  const buffer = await file.arrayBuffer();
  const rows = parseSpreadsheet(file.name, buffer);
  if (rows.length === 0) {
    return { ok: false, error: "No rows found in that file." };
  }

  const batch = await db.importBatch.create({
    data: {
      importType: "PURCHASE_HISTORY",
      fileName: file.name,
      rowCount: 0,
      uploadedById: session.userId as string,
    },
  });

  const storeCache = new Map<string, string | null>();
  let imported = 0;

  for (const row of rows) {
    const code = findColumn(row, PURCHASE_HISTORY_ALIASES.code);
    const itemName = findColumn(row, PURCHASE_HISTORY_ALIASES.itemName);
    const quantityRaw = findColumn(row, PURCHASE_HISTORY_ALIASES.quantity);
    if (!code || !itemName || quantityRaw === undefined) continue;

    if (!storeCache.has(code)) {
      const store = await db.store.findUnique({ where: { externalCode: code } });
      storeCache.set(code, store?.id ?? null);
    }
    const storeId = storeCache.get(code);
    if (!storeId) continue;

    const unit = findColumn(row, PURCHASE_HISTORY_ALIASES.unit);
    const periodStartRaw = findColumn(row, PURCHASE_HISTORY_ALIASES.periodStart);
    const periodEndRaw = findColumn(row, PURCHASE_HISTORY_ALIASES.periodEnd);

    await db.purchaseHistoryItem.create({
      data: {
        storeId,
        itemName,
        quantity: Number(quantityRaw),
        unit,
        periodStart: periodStartRaw ? new Date(periodStartRaw) : undefined,
        periodEnd: periodEndRaw ? new Date(periodEndRaw) : undefined,
        uploadBatchId: batch.id,
      },
    });

    imported += 1;
  }

  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: imported } });

  revalidatePath("/admin/imports");
  revalidatePath("/admin/intelligence");
  return { ok: true, rowCount: imported };
}
