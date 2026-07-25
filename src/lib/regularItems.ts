import * as XLSX from "xlsx";

export interface RegularItemRow {
  code: string;
  itemName: string;
  quantity: number;
  totalValue: number;
}

const MAX_ITEMS_PER_STORE = 100;

/**
 * Parses the owner's "Party VS Item Wise Sale Analysis" Excel export.
 * Structure: an unindented row is a store's subtotal (name, ledger code,
 * totals across all its items); each indented row below it (leading spaces
 * on the name) is one specific item that store bought, sharing that same
 * ledger code. The subtotal rows themselves are skipped — only the
 * per-item rows are imported. Column order (by position, since the report's
 * own title text ends up as the header row when read literally): name,
 * ledger code, sale qty, free qty (ignored), amount, ...(ignored).
 *
 * Returns at most the top 100 items per store, ranked by sale amount
 * descending, since a full year can include far more line items than are
 * useful for a "what do they usually order" prompt.
 */
export function parseRegularItemsExcel(data: ArrayBuffer): RegularItemRow[] {
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true });

  const byStore = new Map<string, Map<string, { quantity: number; totalValue: number }>>();
  let currentCode: string | null = null;

  for (const row of rows) {
    const rawName = row[0];
    const rawCode = row[1];
    const name = typeof rawName === "string" ? rawName : String(rawName ?? "");
    if (!name.trim()) continue;

    const code = String(rawCode ?? "").trim();
    const isValidCode = /^\d+$/.test(code);
    if (!isValidCode) continue; // title / period / repeated-header rows

    const isItemRow = /^\s+/.test(name); // indented under its store

    if (!isItemRow) {
      // Store subtotal row — just tracks which code subsequent item rows
      // belong to; not imported as an item itself.
      currentCode = code;
      continue;
    }

    if (!currentCode) continue; // orphan item row with no preceding store — skip

    const quantity = Number(row[2]) || 0;
    const amount = Number(row[4]) || 0;
    const itemName = name.trim();
    if (!itemName) continue;

    if (!byStore.has(currentCode)) byStore.set(currentCode, new Map());
    const items = byStore.get(currentCode)!;
    const existing = items.get(itemName);
    if (existing) {
      existing.quantity += quantity;
      existing.totalValue += amount;
    } else {
      items.set(itemName, { quantity, totalValue: amount });
    }
  }

  const result: RegularItemRow[] = [];
  for (const [code, items] of byStore) {
    const ranked = [...items.entries()]
      .sort((a, b) => b[1].totalValue - a[1].totalValue)
      .slice(0, MAX_ITEMS_PER_STORE);

    for (const [itemName, { quantity, totalValue }] of ranked) {
      result.push({ code, itemName, quantity, totalValue });
    }
  }

  return result;
}
