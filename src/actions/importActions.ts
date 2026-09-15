"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { parseSpreadsheet, findColumn } from "@/lib/csv";
import { parseOutstandingPdf } from "@/lib/pdfOutstanding";
import { parseRegularItemsExcel, parseFastOrderItemsReport } from "@/lib/regularItems";
import { parseStockExpiryReport, stockMatchKey } from "@/lib/stockExpiryReport";
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
  const db = getOrgScopedDb(session.orgId);

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
          where: { orgId_name: { orgId: session.orgId, name: routeName } },
          update: {},
          create: { orgId: session.orgId, name: routeName },
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
        where: { orgId_externalCode: { orgId: session.orgId, externalCode: code } },
        update: { name, address, phone, routeId, visitSequence },
        create: { orgId: session.orgId, externalCode: code, name, address, phone, routeId, visitSequence },
      });
    } else {
      store = await db.store.create({
        data: { orgId: session.orgId, name, address, phone, routeId, visitSequence },
      });
    }

    if (routeId) {
      await db.routeStore.upsert({
        where: { routeId_storeId: { routeId, storeId: store.id } },
        update: { visitSequence },
        create: { orgId: session.orgId, routeId, storeId: store.id, visitSequence },
      });
    }

    imported += 1;
  }

  await db.importBatch.create({
    data: {
      orgId: session.orgId,
      importType: "STORE_MASTER",
      fileName: file.name,
      rowCount: imported,
      uploadedById: session.userId as string,
    },
  });

  revalidatePath("/team/admin/imports");
  revalidatePath("/team/admin/routes");
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
  const db = getOrgScopedDb(session.orgId);

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
      orgId: session.orgId,
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
      const store = await db.store.findFirst({ where: { externalCode: row.code } });
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
        orgId: session.orgId,
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

  revalidatePath("/team/admin/imports");
  revalidatePath("/team/admin/outstanding");
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
  const db = getOrgScopedDb(session.orgId);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a file to upload." };
  }

  const buffer = await file.arrayBuffer();

  const parsedRows: Array<{ code: string; itemName: string; quantity: number; totalValue?: number }> =
    [];

  // The owner's "Party VS Item Wise Sale Analysis" export (store subtotal
  // rows followed by indented per-item rows) is the expected real format —
  // try it first, whether it arrived as CSV or Excel (XLSX.read auto-detects
  // either from the raw bytes regardless of file extension).
  {
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
      orgId: session.orgId,
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
      const store = await db.store.findFirst({ where: { externalCode: row.code } });
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
        orgId: session.orgId,
        storeId,
        itemName: row.itemName,
        quantity: row.quantity,
        totalValue: row.totalValue,
        uploadBatchId: batch.id,
      },
    });
  }

  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: imported } });

  revalidatePath("/team/admin/imports");
  revalidatePath("/team/admin/intelligence");
  return { ok: true, rowCount: imported };
}

// Same source report as importPurchaseHistory, but ranked by quantity and
// capped at 50/store into a dedicated table — see FastOrderItem's schema
// comment for why this stays separate from PurchaseHistoryItem.
export async function importFastOrderItems(
  _prevState: (ActionResult & { rowCount?: number }) | null,
  formData: FormData,
): Promise<ActionResult & { rowCount?: number }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a file to upload." };
  }

  const buffer = await file.arrayBuffer();
  const parsedRows = parseFastOrderItemsReport(buffer);

  if (parsedRows.length === 0) {
    return { ok: false, error: "No fast-order rows could be read from that file." };
  }

  const batch = await db.importBatch.create({
    data: {
      orgId: session.orgId,
      importType: "FAST_ORDER_ITEMS",
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
      const store = await db.store.findFirst({ where: { externalCode: row.code } });
      storeCache.set(row.code, store?.id ?? null);
    }
    const storeId = storeCache.get(row.code);
    if (!storeId) continue;
    touchedStoreIds.add(storeId);
    imported += 1;
  }

  if (touchedStoreIds.size > 0) {
    await db.fastOrderItem.deleteMany({ where: { storeId: { in: [...touchedStoreIds] } } });
  }

  for (const row of parsedRows) {
    const storeId = storeCache.get(row.code);
    if (!storeId) continue;

    await db.fastOrderItem.create({
      data: {
        orgId: session.orgId,
        storeId,
        itemName: row.itemName,
        quantity: row.quantity,
        totalValue: row.totalValue,
        uploadBatchId: batch.id,
      },
    });
  }

  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: imported } });

  revalidatePath("/team/admin/imports");
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
  const db = getOrgScopedDb(session.orgId);

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
      orgId: session.orgId,
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
      orgId: session.orgId,
      itemName: row.itemName,
      expiryDate: row.expiryDate,
      specialRate: row.specialRate,
      uploadBatchId: batch.id,
    })),
  });

  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: parsedRows.length } });

  revalidatePath("/team/admin/imports");
  revalidatePath("/team/admin/intelligence");
  return { ok: true, rowCount: parsedRows.length };
}

/**
 * Warehouse "STOCK REPORT" upload — one file that does two things at once:
 * 1. Writes current stock + nearest expiry onto every matched Product (only
 *    products found in the file are touched; anything not in this report is
 *    left as-is, same "only what's in the file changes" rule every other
 *    import in this app follows).
 * 2. Fully replaces the Clearance list (ExpiryItem) with the top 50 matched
 *    items expiring in the next 3 months, ranked by value (current selling
 *    price x quantity) — the ExpiryItem upload card above still exists for a
 *    manual one-off override, but this is meant to be the normal path now.
 * Discount steps down the further out the expiry is: 70% off items expiring
 * this month or next, 50% the month after that, 20% the month after that;
 * anything expiring later isn't discounted or listed here at all.
 */
export async function importStockAndExpiry(
  _prevState: (ActionResult & { rowCount?: number }) | null,
  formData: FormData,
): Promise<ActionResult & { rowCount?: number }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a file to upload." };
  }

  const buffer = await file.arrayBuffer();
  const items = parseStockExpiryReport(buffer);

  if (items.length === 0) {
    return { ok: false, error: "No item/stock rows could be read from that file." };
  }

  const products = await db.product.findMany({ select: { id: true, name: true, price: true } });
  const productByKey = new Map(products.map((p) => [stockMatchKey(p.name), p]));

  const matched: Array<{
    productId: string;
    productName: string;
    price: number;
    totalQuantity: number;
    nearestExpiry: Date | null;
  }> = [];
  for (const item of items) {
    const product = productByKey.get(stockMatchKey(item.itemName));
    if (!product) continue;
    matched.push({
      productId: product.id,
      productName: product.name,
      price: Number(product.price),
      totalQuantity: item.totalQuantity,
      nearestExpiry: item.nearestExpiry,
    });
  }

  if (matched.length === 0) {
    return { ok: false, error: "None of the items in that file matched a product in your catalog." };
  }

  const batch = await db.importBatch.create({
    data: {
      orgId: session.orgId,
      importType: "STOCK_AND_EXPIRY",
      fileName: file.name,
      rowCount: 0,
      uploadedById: session.userId as string,
    },
  });

  for (const m of matched) {
    await db.product.update({
      where: { id: m.productId },
      data: { stock: Math.round(m.totalQuantity), nearestExpiry: m.nearestExpiry },
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMonthIndex = today.getFullYear() * 12 + today.getMonth();

  const clearanceCandidates = matched
    .filter((m) => m.nearestExpiry && m.totalQuantity > 0 && m.nearestExpiry.getTime() >= today.getTime())
    .map((m) => ({
      ...m,
      monthsAhead: m.nearestExpiry!.getFullYear() * 12 + m.nearestExpiry!.getMonth() - todayMonthIndex,
    }))
    .filter((m) => m.monthsAhead >= 0 && m.monthsAhead <= 3)
    .map((m) => {
      const discountPercent = m.monthsAhead <= 1 ? 70 : m.monthsAhead === 2 ? 50 : 20;
      return {
        ...m,
        value: m.price * m.totalQuantity,
        specialRate: Math.round(m.price * (1 - discountPercent / 100) * 100) / 100,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 50);

  // Each upload is a fresh full snapshot of near-expiry stock, same as the
  // manual ExpiryItem upload above — replace the whole list every time.
  await db.expiryItem.deleteMany({});
  if (clearanceCandidates.length > 0) {
    await db.expiryItem.createMany({
      data: clearanceCandidates.map((c) => ({
        orgId: session.orgId,
        itemName: c.productName,
        expiryDate: c.nearestExpiry!,
        specialRate: c.specialRate,
        uploadBatchId: batch.id,
      })),
    });
  }

  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: matched.length } });

  revalidatePath("/team/admin/imports");
  revalidatePath("/team/admin/products");
  revalidatePath("/team/admin/intelligence");
  revalidatePath("/team/salesman/near-expiry");
  revalidatePath("/shop/products");
  revalidatePath("/shop/clearance");
  return { ok: true, rowCount: matched.length };
}

const INCENTIVE_ALIASES = {
  itemName: ["item", "item name", "product", "product name"],
  incentiveAmount: ["incentive", "incentive amount", "amount", "bonus"],
};

export async function importIncentiveItems(
  _prevState: (ActionResult & { rowCount?: number }) | null,
  formData: FormData,
): Promise<ActionResult & { rowCount?: number }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a file to upload." };
  }

  const buffer = await file.arrayBuffer();
  const rows = parseSpreadsheet(file.name, buffer);

  const parsedRows: Array<{ itemName: string; incentiveAmount: number }> = [];
  for (const row of rows) {
    const itemName = findColumn(row, INCENTIVE_ALIASES.itemName);
    const amountRaw = findColumn(row, INCENTIVE_ALIASES.incentiveAmount);
    if (!itemName || amountRaw === undefined) continue;
    parsedRows.push({ itemName, incentiveAmount: Number(amountRaw) });
  }

  if (parsedRows.length === 0) {
    return { ok: false, error: "No item/incentive rows could be read from that file." };
  }

  const batch = await db.importBatch.create({
    data: {
      orgId: session.orgId,
      importType: "INCENTIVE_ITEMS",
      fileName: file.name,
      rowCount: 0,
      uploadedById: session.userId as string,
    },
  });

  // Current incentive scheme is a full snapshot — replace the whole list
  // each time, same as ExpiryItem.
  await db.incentiveItem.deleteMany({});
  await db.incentiveItem.createMany({
    data: parsedRows.map((row) => ({
      orgId: session.orgId,
      itemName: row.itemName,
      incentiveAmount: row.incentiveAmount,
      uploadBatchId: batch.id,
    })),
  });

  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: parsedRows.length } });

  revalidatePath("/team/admin/imports");
  revalidatePath("/team/salesman/dashboard");
  return { ok: true, rowCount: parsedRows.length };
}

const PARTY_LIST_ALIASES = {
  code: ["code", "store code", "id", "store id"],
};

export async function importTelecallerParties(
  _prevState: (ActionResult & { rowCount?: number }) | null,
  formData: FormData,
): Promise<ActionResult & { rowCount?: number }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a file to upload." };
  }

  const buffer = await file.arrayBuffer();
  const rows = parseSpreadsheet(file.name, buffer);

  const codes: string[] = [];
  for (const row of rows) {
    const code = findColumn(row, PARTY_LIST_ALIASES.code);
    if (code) codes.push(code);
  }

  if (codes.length === 0) {
    return { ok: false, error: "No store codes could be read from that file." };
  }

  const stores = await db.store.findMany({ where: { externalCode: { in: codes } } });
  if (stores.length === 0) {
    return { ok: false, error: "None of those store codes matched an existing store." };
  }

  const batch = await db.importBatch.create({
    data: {
      orgId: session.orgId,
      importType: "TELECALLER_PARTY_LIST",
      fileName: file.name,
      rowCount: 0,
      uploadedById: session.userId as string,
    },
  });

  // Each upload is the full current call list — replace it entirely rather
  // than only adding to it, so removed parties actually drop off the list.
  await db.telecallerParty.deleteMany({});
  await db.telecallerParty.createMany({
    data: stores.map((s) => ({ orgId: session.orgId, storeId: s.id, uploadBatchId: batch.id })),
  });

  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: stores.length } });

  revalidatePath("/team/admin/imports");
  revalidatePath("/team/telecaller/dashboard");
  return { ok: true, rowCount: stores.length };
}
