import * as XLSX from "xlsx";

export interface MargOutstandingRow {
  code: string;
  invoiceNo: string | null;
  invoiceDate: Date | null;
  dueDate: Date | null;
  billAmount: number;
  outstandingAmount: number;
}

export interface MargParty {
  code: string;
  // Best-effort — MARG's export glues a stray classification digit onto some
  // names with no separating space (e.g. "2GOODLIFE" for a real "Goodlife
  // Pharmacy") and splits others across the row's next columns; both are
  // handled, but this is still an OCR-adjacent guess, not authoritative data.
  // Only ever used as the starting name for a brand-new store — an existing
  // store's own name is never touched by this import.
  name: string | null;
  address: string | null;
  phone: string | null;
}

export interface MargOutstandingReport {
  rows: MargOutstandingRow[];
  // One entry per distinct party the report lists, in file order — lets the
  // caller create a store for a code with no existing match instead of
  // silently dropping its bills.
  parties: MargParty[];
  // The report prints its own bill count and grand total; callers compare
  // them with what was parsed before replacing any live data.
  expectedBills: number | null;
  expectedTotal: number | null;
}

const PARTY_RE = /^-(\d+)\s+(.*)$/;
// A stray single digit MARG glues directly onto the front of some names with
// no separating space (observed as a party-classification code, not part of
// the name — e.g. the same chain appears as both "2GOODLIFE PHARMACY" and
// "6GOODLIFE PHARMACY" at two different addresses/codes).
const LEADING_DIGIT_RE = /^\d([A-Z].*)$/;
const DATE_RE = /^(\d{2})-(\d{2})-(\d{2})$/;
const PHONE_LABEL_RE = /phone\s*:|mobile\s*:/i;

function parseDate(raw: unknown): Date | null {
  const m = String(raw ?? "").trim().match(DATE_RE);
  if (!m) return null;
  return new Date(Date.UTC(2000 + Number(m[3]), Number(m[2]) - 1, Number(m[1])));
}

function num(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function cleanNamePart(part: string): string {
  const stripped = part.match(LEADING_DIGIT_RE)?.[1] ?? part;
  return stripped.trim();
}

/** True for the MARG "DEBTORS OUTSTANDING AS ON <date>" Excel report. */
export function looksLikeMargOutstanding(cells: unknown[][]): boolean {
  return cells.slice(0, 12).some((r) => /DEBTORS\s+OUTSTANDING/i.test(String(r[0] ?? "")));
}

/**
 * Parses MARG's "Debtors Outstanding" Excel export. Each party starts with a
 * "-<code>  <name>" line (occasionally just "-<code>" with the name pushed
 * into the next cell instead, when the source text had a space right after
 * the code) and lists its unpaid invoices below it as
 * [invoice no, date, "<bill value> <received>", balance, due date, overdue days].
 * Between the party line and its first invoice, MARG prints the party's
 * address (one cell, occasionally wrapped across more than one row) and a
 * "Phone : ... Mobile : ..." line — both best-effort captured per party so an
 * unmatched code can still become a real store instead of being dropped.
 */
export function parseMargOutstandingReport(buffer: ArrayBuffer): MargOutstandingReport | null {
  const workbook = XLSX.read(buffer, { type: "array" });
  const cells = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[0]], {
    header: 1,
    defval: "",
  });
  if (!looksLikeMargOutstanding(cells)) return null;

  const rows: MargOutstandingRow[] = [];
  const parties: MargParty[] = [];
  let current: MargParty | null = null;
  let expectedBills: number | null = null;
  let expectedTotal: number | null = null;

  const startParty = (code: string, namePart: string | null): MargParty => {
    const p: MargParty = { code, name: namePart ? cleanNamePart(namePart) : null, address: null, phone: null };
    parties.push(p);
    return p;
  };

  for (const r of cells) {
    const col1 = r[1];
    const label = String(col1 ?? "");

    const totals = label.match(/TOTAL NO\. OF/i) && String(r[2] ?? "").match(/BILLS\s*:\s*(\d+)/i);
    if (totals) {
      expectedBills = Number(totals[1]);
      expectedTotal = num(r[4]);
      continue;
    }

    // Normal case: code and (at least the start of) the name share one cell,
    // e.g. "-5629  2GOODLIFE" with "PHARMACY" continuing in the next cell.
    const party = label.match(PARTY_RE);
    if (party) {
      const nameCells = [party[2], r[2], r[3]].filter((c): c is string => typeof c === "string" && c.trim() !== "");
      current = startParty(party[1], nameCells.length > 0 ? nameCells.join(" ") : null);
      continue;
    }
    // Rarer case: the source cell was just "-<code>" with nothing glued on
    // (no trailing space+text to force it into a string), so Excel stored it
    // as a plain negative number and the name starts fresh in the next cell.
    if (typeof col1 === "number" && col1 < 0 && Number.isInteger(col1)) {
      const code = String(Math.abs(col1));
      const nameCells = [r[2], r[3]].filter((c): c is string => typeof c === "string" && c.trim() !== "");
      current = startParty(code, nameCells.length > 0 ? nameCells.join(" ") : null);
      continue;
    }

    const invoiceDate = parseDate(r[2]);
    if (current && invoiceDate) {
      const billAmount = num(String(r[3] ?? "").trim().split(/\s+/)[0]);
      rows.push({
        code: current.code,
        invoiceNo: label.trim() || null,
        invoiceDate,
        dueDate: parseDate(r[5]),
        billAmount,
        outstandingAmount: num(r[4]),
      });
      continue;
    }

    // Between the party line and its first invoice: phone/mobile line, or
    // address text (address is free-form and has no reliable column to key
    // off, so anything here that isn't a phone line and isn't already
    // captured is treated as (more) address text).
    if (current && !current.name && typeof r[2] === "string" && r[2].trim() !== "" && !invoiceDate) {
      // A party row whose name didn't fit in row 1 at all (rare) sometimes
      // continues here — only for parties we couldn't name yet.
      current.name = cleanNamePart(r[2]);
      continue;
    }
    // "Phone :"/"Mobile :" labels land in different columns depending on how
    // much of the row the address text ahead of them took up — check each
    // plausible label column and read the number from the next cell over.
    if (current && !current.phone) {
      const phoneParts: string[] = [];
      for (let col = 1; col <= 4; col++) {
        if (typeof r[col] === "string" && PHONE_LABEL_RE.test(r[col] as string)) {
          const val = r[col + 1];
          if (val !== "" && val !== undefined) phoneParts.push(String(val));
        }
      }
      if (phoneParts.length > 0) {
        current.phone = phoneParts.join(" / ");
        continue;
      }
    }
    if (current && typeof r[0] === "string" && r[0].trim() !== "") {
      current.address = current.address ? `${current.address}, ${r[0].trim()}` : r[0].trim();
      continue;
    }
  }

  return { rows, parties, expectedBills, expectedTotal };
}
