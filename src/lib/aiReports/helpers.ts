import type { Cell, LedgerRow, PartyInfo, ReportCtx, ReportParams, Row } from "./types";

export function toNum(value: string | undefined): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value.replace(/[,\s₹]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const round0 = (n: number) => Math.round(n);
export const pct = (part: number, whole: number) => (whole === 0 ? 0 : round2((part / whole) * 100));
export const sum = <T>(items: T[], f: (x: T) => number) => items.reduce((a, x) => a + f(x), 0);

export function groupBy<T>(items: T[], key: (x: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return m;
}

export function normalizeName(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

export function matchesText(haystack: string, needle: string): boolean {
  const n = normalizeName(needle);
  if (!n) return false;
  const h = normalizeName(haystack);
  return n.split(" ").every((w) => h.includes(w));
}

// Invoice age buckets, by days since the invoice date.
export const AGE_BUCKETS: { key: string; label: string; min: number; max: number }[] = [
  { key: "b0", label: "0-30 days", min: 0, max: 30 },
  { key: "b1", label: "31-60 days", min: 31, max: 60 },
  { key: "b2", label: "61-90 days", min: 61, max: 90 },
  { key: "b3", label: "91-180 days", min: 91, max: 180 },
  { key: "b4", label: "181-365 days", min: 181, max: 365 },
  { key: "b5", label: "Over 365 days", min: 366, max: Number.POSITIVE_INFINITY },
];

export function ageBucket(days: number | null) {
  if (days == null) return null;
  return AGE_BUCKETS.find((b) => days >= b.min && days <= b.max) ?? AGE_BUCKETS[0];
}

export interface PartyBalance {
  party: PartyInfo;
  outstanding: number;
  bills: number;
  overdue: number; // outstanding on bills past their due date
  over90: number; // outstanding on bills more than 90 days past due
  oldestOverdueDays: number;
  buckets: Record<string, number>;
}

// One row per party that has open bills, built from the outstanding statement.
export async function partyBalances(ctx: ReportCtx): Promise<PartyBalance[]> {
  const [ledger, parties] = await Promise.all([ctx.ledger(), ctx.parties()]);
  const out = new Map<string, PartyBalance>();
  for (const l of ledger) {
    const party = parties.get(l.storeId);
    if (!party) continue;
    let pb = out.get(l.storeId);
    if (!pb) {
      pb = { party, outstanding: 0, bills: 0, overdue: 0, over90: 0, oldestOverdueDays: 0, buckets: {} };
      out.set(l.storeId, pb);
    }
    pb.outstanding += l.outstanding;
    pb.bills += 1;
    if (l.overdueDays != null && l.overdueDays > 0) {
      pb.overdue += l.outstanding;
      if (l.overdueDays > 90) pb.over90 += l.outstanding;
      if (l.overdueDays > pb.oldestOverdueDays) pb.oldestOverdueDays = l.overdueDays;
    }
    const b = ageBucket(l.ageDays);
    if (b) pb.buckets[b.key] = (pb.buckets[b.key] ?? 0) + l.outstanding;
  }
  return [...out.values()];
}

export function totalOutstanding(rows: LedgerRow[]) {
  return sum(rows, (r) => r.outstanding);
}

export function overdueRows(rows: LedgerRow[]) {
  return rows.filter((r) => r.overdueDays != null && r.overdueDays > 0);
}

export function partyRow(p: PartyInfo): Row {
  return { party: p.label, route: p.route, phone: p.phone };
}

export function requireParams(params: ReportParams, keys: string[]): boolean {
  return keys.every((k) => (params[k] ?? "").trim() !== "");
}

export const COLS = {
  party: { key: "party", label: "Party" },
  route: { key: "route", label: "Route" },
  phone: { key: "phone", label: "Phone" },
  address: { key: "address", label: "Address" },
  inr: (key: string, label: string) => ({ key, label, format: "inr" as const }),
  int: (key: string, label: string) => ({ key, label, format: "int" as const }),
  pct: (key: string, label: string) => ({ key, label, format: "pct" as const }),
  date: (key: string, label: string) => ({ key, label, format: "date" as const }),
  text: (key: string, label: string) => ({ key, label }),
};

export function dateCell(d: Date | null): Cell {
  return d ? d.toISOString().slice(0, 10) : null;
}

export function istMonthKey(d: Date): string {
  const shifted = new Date(d.getTime() + 5.5 * 3600e3);
  return shifted.toISOString().slice(0, 7);
}
