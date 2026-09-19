import * as XLSX from "xlsx";

// Companies that give a yearly free-thing on sale. The billing report lists
// several sub-ledgers per company; retailers see them rolled up.
export const COMPANY_SALE_GROUPS: { company: string; ledgers: string[] }[] = [
  { company: "SMART", ledgers: ["SMART", "SMART 2", "SMART BFGF"] },
  { company: "SMARTWAY", ledgers: ["SMW SMS", "SMW WELLNESS", "SMW GIFT"] },
  { company: "CUREWAY", ledgers: ["CUREWAY"] },
  { company: "SMART ICONIC", ledgers: ["S ICONIC"] },
];

const GROUP_BY_LEDGER = new Map(
  COMPANY_SALE_GROUPS.flatMap((g) => g.ledgers.map((l) => [l, g.company] as const)),
);

export interface CompanySaleRow {
  code: string;
  company: string;
  amount: number;
  freeQty: number;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Parses the "Party VS Company Wise Sale Analysis" report into per-store, per-group net sales. */
export function parseCompanySaleReport(buffer: ArrayBuffer): { rows: CompanySaleRow[]; periodEnd: Date | null } {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const cells = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  let periodEnd: Date | null = null;
  const totals = new Map<string, CompanySaleRow>();

  for (const cell of cells) {
    const label = String(cell[0] ?? "");
    const period = label.match(/TO\s+(\d{1,2})-(\d{1,2})-(\d{4})/i);
    if (period) periodEnd = new Date(Date.UTC(Number(period[3]), Number(period[2]) - 1, Number(period[1])));

    // Company sub-rows are indented under their party; party rows are not.
    if (!/^\s{2,}\S/.test(label)) continue;
    const company = GROUP_BY_LEDGER.get(label.trim());
    const code = String(cell[1] ?? "").trim();
    if (!company || !code) continue;

    const key = `${code}|${company}`;
    const entry = totals.get(key) ?? { code, company, amount: 0, freeQty: 0 };
    entry.amount += num(cell[4]) - num(cell[8]);
    entry.freeQty += num(cell[3]) - num(cell[10]);
    totals.set(key, entry);
  }

  return { rows: [...totals.values()], periodEnd };
}

/** "till 18-9-26" style date used on the retailer page. */
export function formatSaleDate(date: Date): string {
  return `${date.getUTCDate()}-${date.getUTCMonth() + 1}-${String(date.getUTCFullYear()).slice(2)}`;
}
