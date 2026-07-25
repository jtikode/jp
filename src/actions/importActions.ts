"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/permissions";
import { parseSpreadsheet, findColumn } from "@/lib/csv";
import { parseOutstandingPdf } from "@/lib/pdfOutstanding";
import { parseRegularItemsExcel } from "@/lib/regularItems";
import type { ActionResult } from "@/actions/employeeActions";

/** Handles both a typed date string and an Excel serial date number. */
function parseFlexibleDate(raw: string): Date | undefined {
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const parsed = XLSX.SSF.parse_date_code(Number(raw));
    if (parsed) return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }
  const asDate = new Date(raw);
  return Number.isNaN(asDate.getTime()) ? undefined : asDate;
}

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
  // The file's row order is the salesman's real-world visit sequence along
  // each route, so track a running counter per route as rows are processed.
  const sequenceCounters = new Map<string, number>();
  let imported = 0;

  for (const row of rows) {
    const name = findColumn(row, STORE_ALIASES.name);
    const address = findAddress(row);
    if (!name || !address) continue;

    const code = findColumn(row, STORE_ALIASES.code);
    const phone = findColumn(row, STORE_ALIASES.phone);
    const routeName = findColumn(row, STORE_ALIASES.route);

    let routeId: string | undefined;
    let visitSequence: number | undefined;
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

      const nextSeq = (sequenceCounters.get(routeId!) ?? 0) + 1;
      sequenceCounters.set(routeId!, nextSeq);
      visitSequence = nextSeq;
    }

    let store;
    if (code) {
      store = await db.store.upsert({
        where: { externalCode: code },
        update: { name, address, phone, routeId, visitSequence },
        create: { externalCode: code, name, address, phone, routeId, visitSequence },
      });
    } else {
      store = await db.store.create({ data: { name, address, phone, routeId, visitSequence } });
    }

    if (routeId) {
      await db.routeStore.upsert({
        where: { routeId_storeId: { routeId, storeId: store.id } },
        update: { visitSequence },
        create: { routeId, storeId: store.id, visitSequence },
      });
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

const OUTSTANDING_ALIASES = {
  code: ["code", "store code", "id", "store id"],
  invoiceNo: ["invoice no", "invoice number", "invoice"],
  invoiceDate: ["invoice date", "date"],
  amount: ["amount", "bill amount", "invoice amount"],
  outstandingAmount: ["outstanding", "outstanding amount", "due amount", "balance"],
  dueDate: ["due date"],
};

export async function importOutstanding(
  _prevState: (ActionResult & { rowCount?: number }) | null,
  formData: FormData,
): Promise<ActionResult & { rowCount?: number }> {
  const session = await assertRole(["ADMIN"]);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a file to upload." };
  }

  const buffer = await file.arrayBuffer();
  const isPdf = file.name.toLowerCase().endsWith(".pdf");

  // { code, invoiceNo, invoiceDate, amount, outstandingAmount }[]
  const parsedRows: Array<{
    code: string;
    invoiceNo?: string;
    invoiceDate?: Date;
    amount: number;
    outstandingAmount: number;
  }> = [];

  if (isPdf) {
    const pdfRows = await parseOutstandingPdf(buffer);
    for (const r of pdfRows) {
      parsedRows.push({
        code: r.code,
        invoiceNo: r.invoiceNo,
        invoiceDate: r.invoiceDate,
        amount: r.billAmount,
        outstandingAmount: r.outstandingAmount,
      });
    }
  } else {
    const rows = parseSpreadsheet(file.name, buffer);
    for (const row of rows) {
      const code = findColumn(row, OUTSTANDING_ALIASES.code);
      const outstandingRaw = findColumn(row, OUTSTANDING_ALIASES.outstandingAmount);
      if (!code || outstandingRaw === undefined) continue;

      const amountRaw = findColumn(row, OUTSTANDING_ALIASES.amount);
      const invoiceNo = findColumn(row, OUTSTANDING_ALIASES.invoiceNo);
      const invoiceDateRaw = findColumn(row, OUTSTANDING_ALIASES.invoiceDate);

      parsedRows.push({
        code,
        invoiceNo,
        invoiceDate: invoiceDateRaw ? new Date(invoiceDateRaw) : undefined,
        amount: amountRaw ? Number(amountRaw) : Number(outstandingRaw),
        outstandingAmount: Number(outstandingRaw),
      });
    }
  }

  if (parsedRows.length === 0) {
    return { ok: false, error: "No outstanding rows could be read from that file." };
  }

  const batch = await db.importBatch.create({
    data: {
      importType: "OUTSTANDING",
      fileName: file.name,
      rowCount: 0,
      uploadedById: session.userId as string,
    },
  });

  const storeCache = new Map<string, string | null>();
  const touchedStoreIds = new Set<string>();
  let imported = 0;

  for (const row of parsedRows) {
    if (!storeCache.has(row.code)) {
      const store = await db.store.findUnique({ where: { externalCode: row.code } });
      storeCache.set(row.code, store?.id ?? null);
    }
    const storeId = storeCache.get(row.code);
    if (!storeId) continue; // no matching store for this code — skip
    touchedStoreIds.add(storeId);
    imported += 1;
  }

  // Each upload is a fresh "as on <date>" snapshot — replace prior outstanding
  // data only for the stores actually present in this file (a "mixed routes"
  // upload shouldn't wipe out other stores' figures from an earlier upload).
  if (touchedStoreIds.size > 0) {
    await db.ledgerEntry.deleteMany({ where: { storeId: { in: [...touchedStoreIds] } } });
  }

  for (const row of parsedRows) {
    const storeId = storeCache.get(row.code);
    if (!storeId) continue;

    await db.ledgerEntry.create({
      data: {
        storeId,
        invoiceNo: row.invoiceNo,
        invoiceDate: row.invoiceDate,
        amount: row.amount,
        outstandingAmount: row.outstandingAmount,
        dueDate: undefined,
        uploadBatchId: batch.id,
      },
    });
  }

  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: imported } });

  revalidatePath("/admin/imports");
  revalidatePath("/admin/outstanding");
  return { ok: true, rowCount: imported };
}

const PURCHASE_HISTORY_ALIASES = {
  code: ["code", "store code", "id", "store id"],
  itemName: ["item", "item name", "product", "product name"],
  quantity: ["quantity", "qty"],
  unit: ["unit", "uom"],
  amount: ["amount", "value", "total value"],
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
  const isExcel = /\.xlsx?$/i.test(file.name);

  const parsedRows: Array<{ code: string; itemName: string; quantity: number; totalValue?: number }> =
    [];

  // The owner's "Party VS Item Wise Sale Analysis" export (store subtotal
  // rows followed by indented per-item rows) is the expected real format
  // for Excel uploads — try it first.
  if (isExcel) {
    const regularItemRows = parseRegularItemsExcel(buffer);
    for (const r of regularItemRows) {
      parsedRows.push({
        code: r.code,
        itemName: r.itemName,
        quantity: r.quantity,
        totalValue: r.totalValue,
      });
    }
  }

  // Fall back to a plain CSV/Excel with generic column headers (code, item,
  // quantity, ...) if the specialized parser found nothing.
  if (parsedRows.length === 0) {
    const rows = parseSpreadsheet(file.name, buffer);
    for (const row of rows) {
      const code = findColumn(row, PURCHASE_HISTORY_ALIASES.code);
      const itemName = findColumn(row, PURCHASE_HISTORY_ALIASES.itemName);
      const quantityRaw = findColumn(row, PURCHASE_HISTORY_ALIASES.quantity);
      if (!code || !itemName || quantityRaw === undefined) continue;

      const amountRaw = findColumn(row, PURCHASE_HISTORY_ALIASES.amount);
      parsedRows.push({
        code,
        itemName,
        quantity: Number(quantityRaw),
        totalValue: amountRaw ? Number(amountRaw) : undefined,
      });
    }
  }

  if (parsedRows.length === 0) {
    return { ok: false, error: "No purchase history rows could be read from that file." };
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
  const touchedStoreIds = new Set<string>();
  let imported = 0;

  for (const row of parsedRows) {
    if (!storeCache.has(row.code)) {
      const store = await db.store.findUnique({ where: { externalCode: row.code } });
      storeCache.set(row.code, store?.id ?? null);
    }
    const storeId = storeCache.get(row.code);
    if (!storeId) continue;
    touchedStoreIds.add(storeId);
    imported += 1;
  }

  // Refresh only the stores present in this file, same reasoning as
  // Outstanding: a periodic re-upload shouldn't erase other stores' data.
  if (touchedStoreIds.size > 0) {
    await db.purchaseHistoryItem.deleteMany({ where: { storeId: { in: [...touchedStoreIds] } } });
  }

  for (const row of parsedRows) {
    const storeId = storeCache.get(row.code);
    if (!storeId) continue;

    await db.purchaseHistoryItem.create({
      data: {
        storeId,
        itemName: row.itemName,
        quantity: row.quantity,
        totalValue: row.totalValue,
        uploadBatchId: batch.id,
      },
    });
  }

  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: imported } });

  revalidatePath("/admin/imports");
  revalidatePath("/admin/intelligence");
  return { ok: true, rowCount: imported };
}

const EXPIRY_ALIASES = {
  itemName: ["item", "item name", "product", "product name"],
  expiryDate: ["expiry", "expiry date", "exp date", "exp"],
  specialRate: ["special rate", "rate", "price", "special price"],
};

export async function importExpiryItems(
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

  const parsedRows: Array<{ itemName: string; expiryDate: Date; specialRate?: number }> = [];
  for (const row of rows) {
    const itemName = findColumn(row, EXPIRY_ALIASES.itemName);
    const expiryRaw = findColumn(row, EXPIRY_ALIASES.expiryDate);
    if (!itemName || !expiryRaw) continue;

    const expiryDate = parseFlexibleDate(expiryRaw);
    if (!expiryDate) continue;

    const rateRaw = findColumn(row, EXPIRY_ALIASES.specialRate);
    parsedRows.push({ itemName, expiryDate, specialRate: rateRaw ? Number(rateRaw) : undefined });
  }

  if (parsedRows.length === 0) {
    return { ok: false, error: "No item/expiry rows could be read from that file." };
  }

  const batch = await db.importBatch.create({
    data: {
      importType: "EXPIRY",
      fileName: file.name,
      rowCount: 0,
      uploadedById: session.userId as string,
    },
  });

  // Each upload is a fresh full snapshot of near-expiry stock (no store
  // dimension to scope by), so replace the whole list every time.
  await db.expiryItem.deleteMany({});

  await db.expiryItem.createMany({
    data: parsedRows.map((row) => ({
      itemName: row.itemName,
      expiryDate: row.expiryDate,
      specialRate: row.specialRate,
      uploadBatchId: batch.id,
    })),
  });

  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: parsedRows.length } });

  revalidatePath("/admin/imports");
  revalidatePath("/admin/intelligence");
  return { ok: true, rowCount: parsedRows.length };
}
