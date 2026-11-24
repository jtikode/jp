import type { getOrgScopedDb } from "@/lib/orgScopedDb";

export type Db = ReturnType<typeof getOrgScopedDb>;

export type CellFormat = "text" | "inr" | "int" | "pct" | "date" | "decimal";

export interface Column {
  key: string;
  label: string;
  format?: CellFormat;
}

export type Cell = string | number | null;
export type Row = Record<string, Cell>;

export interface Stat {
  label: string;
  value: number | string;
  format?: CellFormat;
  // Small line under the number, e.g. what it is measured against.
  hint?: string;
  tone?: "good" | "warn" | "bad";
}

export interface ReportResult {
  columns: Column[];
  rows: Row[];
  // Figures shown above the table.
  stats?: Stat[];
  // A caveat about the data behind this report.
  note?: string;
  // Plain text ready to paste into WhatsApp (daily summary only).
  text?: string;
}

export interface Param {
  key: string;
  label: string;
  type: "number" | "text";
  placeholder?: string;
}

export type ReportParams = Record<string, string>;

export interface ReportDef {
  id: string;
  group: GroupId;
  category: string;
  title: string;
  params?: Param[];
  run: (ctx: ReportCtx, params: ReportParams) => Promise<ReportResult>;
}

export type GroupId = "account" | "outstanding" | "sales" | "stock" | "batch" | "tools";

export interface GroupDef {
  id: GroupId;
  title: string;
  blurb: string;
  // Where the numbers come from, shown on the page so nobody over-reads them.
  source: string;
  dashboard: (ctx: ReportCtx) => Promise<Stat[]>;
}

export interface LedgerRow {
  storeId: string;
  invoiceNo: string;
  invoiceDate: Date | null;
  dueDate: Date | null;
  amount: number;
  outstanding: number;
  // Whole days since the invoice date (null when there is no date).
  ageDays: number | null;
  // Whole days past the due date: positive means overdue, negative means not yet due.
  overdueDays: number | null;
}

export interface PartyInfo {
  id: string;
  name: string;
  code: string;
  label: string;
  route: string;
  phone: string;
  address: string;
}

export interface ProductInfo {
  id: string;
  name: string;
  company: string;
  price: number;
  purchaseRate: number | null;
  mrp: number | null;
  stock: number | null;
  nearestExpiry: Date | null;
  active: boolean;
}

export interface SaleLine {
  productId: string;
  productName: string;
  company: string;
  storeId: string;
  quantity: number;
  value: number;
  orderedAt: Date;
}

export interface ReportCtx {
  db: Db;
  orgId: string;
  today: Date; // 00:00 IST today, as a UTC instant
  ledger: () => Promise<LedgerRow[]>;
  parties: () => Promise<Map<string, PartyInfo>>;
  allParties: () => Promise<PartyInfo[]>;
  products: () => Promise<ProductInfo[]>;
  sales: () => Promise<SaleLine[]>;
}
