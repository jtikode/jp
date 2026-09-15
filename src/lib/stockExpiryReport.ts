import * as XLSX from "xlsx";

export interface AggregatedStockItem {
  itemName: string;
  totalQuantity: number;
  nearestExpiry: Date | null;
}

/**
 * Looser than the shared `normalizeName` (which only trims/collapses
 * whitespace) — this also strips cosmetic punctuation (periods, apostrophes,
 * asterisks, commas) and removes whitespace entirely, so e.g. "10'S" and
 * "10 S" collapse together. Used only to match this report's item names
 * against existing Product records at import time; whatever Product ends up
 * matched is what gets written everywhere downstream (by its real `name`),
 * so this looseness never leaks into stored data.
 */
export function stockMatchKey(name: string): string {
  return name.toUpperCase().replace(/[.'*,]/g, "").replace(/\s+/g, "");
}

function parseBatchDate(raw: unknown): Date | undefined {
  const s = String(raw ?? "").trim();
  if (!s || /^-+$/.test(s.replace(/\s/g, ""))) return undefined; // "  -   -" = not tracked
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Parses the owner's warehouse "STOCK REPORT" export (XLS/XLSX — XLSX.read
 * auto-detects the real format from the bytes). One row per batch: a single
 * item can appear on several rows (different Rec.Date/Batch/EXP) when
 * multiple purchase lots of it are still on the shelf. Fixed column layout
 * (by position, since the two-row header doesn't parse cleanly as named
 * columns): Product Name @1, Current Stock @3, EXP @18.
 *
 * Rows are grouped by item name (case/whitespace/punctuation-insensitive, so
 * "COOLWAVE LAVENDER PO 75GM" and "... 75 GM" collapse together same as the
 * scheme-sheet import) into one row per item: quantity summed across all its
 * batches, and expiry set to the *nearest* (soonest) of them — batches with
 * no EXP tracked ("  -   -") don't count against that item having one.
 */
export function parseStockExpiryReport(data: ArrayBuffer): AggregatedStockItem[] {
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true });

  const byKey = new Map<string, AggregatedStockItem>();

  for (const row of rows) {
    const rawName = row[1];
    const name = typeof rawName === "string" ? rawName.trim() : "";
    if (!name) continue; // title/header rows and the trailing grand-total row

    const quantity = Number(row[3]);
    if (!Number.isFinite(quantity)) continue;

    const expiryDate = parseBatchDate(row[18]);

    const key = stockMatchKey(name);
    const existing = byKey.get(key);
    if (existing) {
      existing.totalQuantity += quantity;
      if (expiryDate && (!existing.nearestExpiry || expiryDate < existing.nearestExpiry)) {
        existing.nearestExpiry = expiryDate;
      }
    } else {
      byKey.set(key, { itemName: name, totalQuantity: quantity, nearestExpiry: expiryDate ?? null });
    }
  }

  return [...byKey.values()];
}
