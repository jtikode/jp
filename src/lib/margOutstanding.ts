import * as XLSX from "xlsx";

export interface MargOutstandingRow {
  code: string;
  invoiceNo: string | null;
  invoiceDate: Date | null;
  dueDate: Date | null;
  billAmount: number;
  outstandingAmount: number;
}

export interface MargOutstandingReport {
  rows: MargOutstandingRow[];
  // The report prints its own bill count and grand total; callers compare
  // them with what was parsed before replacing any live data.
  expectedBills: number | null;
  expectedTotal: number | null;
  parties: number;
}

const PARTY_RE = /^-(\d+)\s+/;
const DATE_RE = /^(\d{2})-(\d{2})-(\d{2})$/;

function parseDate(raw: unknown): Date | null {
  const m = String(raw ?? "").trim().match(DATE_RE);
  if (!m) return null;
  return new Date(Date.UTC(2000 + Number(m[3]), Number(m[2]) - 1, Number(m[1])));
}

function num(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

/** True for the MARG "DEBTORS OUTSTANDING AS ON <date>" Excel report. */
export function looksLikeMargOutstanding(cells: unknown[][]): boolean {
  return cells.slice(0, 12).some((r) => /DEBTORS\s+OUTSTANDING/i.test(String(r[0] ?? "")));
}

/**
 * Parses MARG's "Debtors Outstanding" Excel export. Each party starts with a
 * "-<code>  <name>" line and lists its unpaid invoices below it as
 * [invoice no, date, "<bill value> <received>", balance, due date, overdue days].
 */
export function parseMargOutstandingReport(buffer: ArrayBuffer): MargOutstandingReport | null {
  const workbook = XLSX.read(buffer, { type: "array" });
  const cells = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[0]], {
    header: 1,
    defval: "",
  });
  if (!looksLikeMargOutstanding(cells)) return null;

  const rows: MargOutstandingRow[] = [];
  let code: string | null = null;
  let parties = 0;
  let expectedBills: number | null = null;
  let expectedTotal: number | null = null;

  for (const r of cells) {
    const label = String(r[1] ?? "");

    const totals = label.match(/TOTAL NO\. OF/i) && String(r[2] ?? "").match(/BILLS\s*:\s*(\d+)/i);
    if (totals) {
      expectedBills = Number(totals[1]);
      expectedTotal = num(r[4]);
      continue;
    }

    const party = label.match(PARTY_RE);
    if (party) {
      code = party[1];
      parties += 1;
      continue;
    }

    const invoiceDate = parseDate(r[2]);
    if (code && invoiceDate) {
      const billAmount = num(String(r[3] ?? "").trim().split(/\s+/)[0]);
      rows.push({
        code,
        invoiceNo: label.trim() || null,
        invoiceDate,
        dueDate: parseDate(r[5]),
        billAmount,
        outstandingAmount: num(r[4]),
      });
    }
  }

  return { rows, expectedBills, expectedTotal, parties };
}
