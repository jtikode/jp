import type { LedgerRow, ReportCtx, ReportDef, ReportResult, Stat } from "../types";
import {
  AGE_BUCKETS,
  COLS,
  ageBucket,
  dateCell,
  groupBy,
  matchesText,
  overdueRows,
  partyBalances,
  pct,
  round0,
  sum,
  toNum,
} from "../helpers";

const FRESH_NOTE =
  "From the last uploaded outstanding statement, not real-time. Open invoices only. The statement has no credit terms (its due date is the invoice date), so a bill counts as overdue 30 days after its invoice date.";

async function billRows(ctx: ReportCtx, bills: LedgerRow[]): Promise<ReportResult["rows"]> {
  const parties = await ctx.parties();
  return bills.map((b) => ({
    party: parties.get(b.storeId)?.label ?? "(unknown party)",
    route: parties.get(b.storeId)?.route ?? "",
    invoice: b.invoiceNo,
    invoiceDate: dateCell(b.invoiceDate),
    dueDate: dateCell(b.dueDate),
    outstanding: round0(b.outstanding),
    age: b.ageDays,
    overdue: b.overdueDays != null && b.overdueDays > 0 ? b.overdueDays : 0,
  }));
}

const BILL_COLS = [
  COLS.party,
  COLS.route,
  COLS.text("invoice", "Invoice"),
  COLS.date("invoiceDate", "Invoice date"),
  COLS.date("dueDate", "Due date"),
  COLS.inr("outstanding", "Outstanding"),
  COLS.int("age", "Age (days)"),
  COLS.int("overdue", "Days overdue"),
];

export const outstandingReports: ReportDef[] = [
  // ---- Customer & Bill Analysis
  {
    id: "out-party-bills",
    group: "outstanding",
    category: "Customer & Bill Analysis",
    title: "Show open bills of a party",
    params: [{ key: "name", label: "Party name (part of it)", type: "text", placeholder: "e.g. laxmi medicals" }],
    run: async (ctx, raw) => {
      const [ledger, parties] = await Promise.all([ctx.ledger(), ctx.parties()]);
      const bills = ledger
        .filter((b) => matchesText(parties.get(b.storeId)?.name ?? "", raw.name ?? ""))
        .sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0));
      return {
        columns: BILL_COLS,
        rows: await billRows(ctx, bills),
        stats: [
          { label: "Open bills", value: bills.length, format: "int" },
          { label: "Total outstanding", value: round0(sum(bills, (b) => b.outstanding)), format: "inr" },
        ],
        note: FRESH_NOTE,
      };
    },
  },
  {
    id: "out-largest-bills",
    group: "outstanding",
    category: "Customer & Bill Analysis",
    title: "Show the 25 largest open bills",
    run: async (ctx) => {
      const bills = [...(await ctx.ledger())].sort((a, b) => b.outstanding - a.outstanding).slice(0, 25);
      return { columns: BILL_COLS, rows: await billRows(ctx, bills), note: FRESH_NOTE };
    },
  },
  {
    id: "out-bills-above",
    group: "outstanding",
    category: "Customer & Bill Analysis",
    title: "Show bills with outstanding above ?",
    params: [{ key: "min", label: "Above (Rs)", type: "number" }],
    run: async (ctx, raw) => {
      const min = toNum(raw.min);
      if (min == null) return { columns: [], rows: [], note: "Enter a valid amount." };
      const bills = (await ctx.ledger()).filter((b) => b.outstanding > min).sort((a, b) => b.outstanding - a.outstanding);
      return {
        columns: BILL_COLS,
        rows: await billRows(ctx, bills),
        stats: [{ label: "Bills", value: bills.length, format: "int" }],
        note: FRESH_NOTE,
      };
    },
  },
  {
    id: "out-bills-per-party",
    group: "outstanding",
    category: "Customer & Bill Analysis",
    title: "Show parties with the most open bills",
    run: async (ctx) => {
      const pbs = (await partyBalances(ctx)).sort((a, b) => b.bills - a.bills || b.outstanding - a.outstanding).slice(0, 25);
      return {
        columns: [COLS.party, COLS.route, COLS.phone, COLS.int("bills", "Open bills"), COLS.inr("outstanding", "Outstanding")],
        rows: pbs.map((p) => ({ party: p.party.label, route: p.party.route, phone: p.party.phone, bills: p.bills, outstanding: round0(p.outstanding) })),
        note: FRESH_NOTE,
      };
    },
  },

  // ---- Ageing & Due Dates
  {
    id: "out-ageing",
    group: "outstanding",
    category: "Ageing & Due Dates",
    title: "Show complete outstanding ageing",
    run: async (ctx) => {
      const ledger = await ctx.ledger();
      const total = sum(ledger, (b) => b.outstanding);
      const groups = groupBy(ledger, (b) => ageBucket(b.ageDays)?.key ?? "none");
      const rows = AGE_BUCKETS.map((bk) => {
        const g = groups.get(bk.key) ?? [];
        const amt = sum(g, (b) => b.outstanding);
        return {
          bucket: bk.label,
          bills: g.length,
          parties: new Set(g.map((b) => b.storeId)).size,
          outstanding: round0(amt),
          share: pct(amt, total),
        };
      });
      const undated = groups.get("none") ?? [];
      if (undated.length) rows.push({ bucket: "No invoice date", bills: undated.length, parties: new Set(undated.map((b) => b.storeId)).size, outstanding: round0(sum(undated, (b) => b.outstanding)), share: pct(sum(undated, (b) => b.outstanding), total) });
      return {
        columns: [COLS.text("bucket", "Invoice age"), COLS.int("bills", "Bills"), COLS.int("parties", "Parties"), COLS.inr("outstanding", "Outstanding"), COLS.pct("share", "Share")],
        rows,
        note: `${FRESH_NOTE} Age is counted from the invoice date.`,
      };
    },
  },
  {
    id: "out-ageing-by-party",
    group: "outstanding",
    category: "Ageing & Due Dates",
    title: "Show ageing party-wise (top 50)",
    run: async (ctx) => {
      const pbs = (await partyBalances(ctx)).sort((a, b) => b.outstanding - a.outstanding).slice(0, 50);
      return {
        columns: [COLS.party, COLS.route, ...AGE_BUCKETS.map((b) => COLS.inr(b.key, b.label)), COLS.inr("outstanding", "Total")],
        rows: pbs.map((p) => ({
          party: p.party.label,
          route: p.party.route,
          ...Object.fromEntries(AGE_BUCKETS.map((b) => [b.key, round0(p.buckets[b.key] ?? 0)])),
          outstanding: round0(p.outstanding),
        })),
        note: `${FRESH_NOTE} Age is counted from the invoice date.`,
      };
    },
  },
  {
    id: "out-overdue-range",
    group: "outstanding",
    category: "Ageing & Due Dates",
    title: "Show bills overdue between ? and ?? days",
    params: [
      { key: "from", label: "From (days overdue)", type: "number", placeholder: "e.g. 31" },
      { key: "to", label: "To (days overdue)", type: "number", placeholder: "e.g. 60" },
    ],
    run: async (ctx, raw) => {
      const from = toNum(raw.from);
      const to = toNum(raw.to);
      if (from == null || to == null) return { columns: [], rows: [], note: "Enter both days." };
      const bills = (await ctx.ledger())
        .filter((b) => b.overdueDays != null && b.overdueDays >= from && b.overdueDays <= to)
        .sort((a, b) => b.outstanding - a.outstanding);
      return {
        columns: BILL_COLS,
        rows: await billRows(ctx, bills),
        stats: [
          { label: "Bills", value: bills.length, format: "int" },
          { label: "Amount overdue", value: round0(sum(bills, (b) => b.outstanding)), format: "inr" },
        ],
        note: `${FRESH_NOTE} Days overdue are counted from the due date.`,
      };
    },
  },
  {
    id: "out-oldest-overdue",
    group: "outstanding",
    category: "Ageing & Due Dates",
    title: "Show the 25 oldest overdue bills",
    run: async (ctx) => {
      const bills = overdueRows(await ctx.ledger())
        .sort((a, b) => (b.overdueDays ?? 0) - (a.overdueDays ?? 0))
        .slice(0, 25);
      return { columns: BILL_COLS, rows: await billRows(ctx, bills), note: FRESH_NOTE };
    },
  },
  {
    id: "out-due-7",
    group: "outstanding",
    category: "Ageing & Due Dates",
    title: "Show payments due in the next 7 days",
    run: async (ctx) => {
      const bills = (await ctx.ledger())
        .filter((b) => b.overdueDays != null && b.overdueDays <= 0 && b.overdueDays >= -7)
        .sort((a, b) => (b.overdueDays ?? 0) - (a.overdueDays ?? 0));
      return {
        columns: BILL_COLS,
        rows: await billRows(ctx, bills),
        stats: [
          { label: "Bills falling due", value: bills.length, format: "int" },
          { label: "Amount", value: round0(sum(bills, (b) => b.outstanding)), format: "inr" },
        ],
        note: FRESH_NOTE,
      };
    },
  },

  // ---- Risk & Collection
  {
    id: "out-call-first",
    group: "outstanding",
    category: "Risk & Collection",
    title: "Whom to call first today (top 25)",
    run: async (ctx) => {
      const pbs = (await partyBalances(ctx))
        .filter((p) => p.overdue > 0)
        .map((p) => ({ p, score: p.overdue * (1 + p.oldestOverdueDays / 180) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 25);
      return {
        columns: [
          COLS.int("rank", "Call order"),
          COLS.party,
          COLS.route,
          COLS.phone,
          COLS.inr("overdue", "Overdue amount"),
          COLS.int("oldest", "Oldest overdue (days)"),
          COLS.inr("outstanding", "Total outstanding"),
        ],
        rows: pbs.map(({ p }, i) => ({
          rank: i + 1,
          party: p.party.label,
          route: p.party.route,
          phone: p.party.phone,
          overdue: round0(p.overdue),
          oldest: p.oldestOverdueDays,
          outstanding: round0(p.outstanding),
        })),
        note: `Ranked by overdue amount, weighted up for how long the oldest bill has been overdue (amount x (1 + days/180)). ${FRESH_NOTE}`,
      };
    },
  },
  {
    id: "out-credit-review",
    group: "outstanding",
    category: "Risk & Collection",
    title: "Parties to review before giving more credit",
    run: async (ctx) => {
      const pbs = (await partyBalances(ctx)).filter((p) => p.over90 >= 10000).sort((a, b) => b.over90 - a.over90);
      return {
        columns: [
          COLS.party,
          COLS.route,
          COLS.phone,
          COLS.inr("over90", "Over 90 days past due"),
          COLS.int("oldest", "Oldest overdue (days)"),
          COLS.inr("outstanding", "Total outstanding"),
        ],
        rows: pbs.map((p) => ({
          party: p.party.label,
          route: p.party.route,
          phone: p.party.phone,
          over90: round0(p.over90),
          oldest: p.oldestOverdueDays,
          outstanding: round0(p.outstanding),
        })),
        stats: [{ label: "Parties to review", value: pbs.length, format: "int" }],
        note: `Rule: Rs 10,000 or more is more than 90 days past its due date. ${FRESH_NOTE}`,
      };
    },
  },
  {
    id: "out-over-180",
    group: "outstanding",
    category: "Risk & Collection",
    title: "Parties with bills older than 180 days",
    run: async (ctx) => {
      const [ledger, parties] = await Promise.all([ctx.ledger(), ctx.parties()]);
      const old = ledger.filter((b) => (b.ageDays ?? 0) > 180);
      const rows = [...groupBy(old, (b) => b.storeId).entries()]
        .map(([id, g]) => ({
          party: parties.get(id)?.label ?? "(unknown party)",
          route: parties.get(id)?.route ?? "",
          phone: parties.get(id)?.phone ?? "",
          bills: g.length,
          outstanding: round0(sum(g, (b) => b.outstanding)),
          oldest: Math.max(...g.map((b) => b.ageDays ?? 0)),
        }))
        .sort((a, b) => b.outstanding - a.outstanding);
      return {
        columns: [COLS.party, COLS.route, COLS.phone, COLS.int("bills", "Bills over 180 days"), COLS.inr("outstanding", "Outstanding"), COLS.int("oldest", "Oldest bill (days)")],
        rows,
        stats: [
          { label: "Parties", value: rows.length, format: "int" },
          { label: "Amount", value: round0(sum(old, (b) => b.outstanding)), format: "inr" },
        ],
        note: FRESH_NOTE,
      };
    },
  },

  // ---- Summary & Reports
  {
    id: "out-summary",
    group: "outstanding",
    category: "Summary & Reports",
    title: "Total outstanding, overdue amount and health",
    run: async (ctx) => {
      const ledger = await ctx.ledger();
      const total = sum(ledger, (b) => b.outstanding);
      const over = overdueRows(ledger);
      const overdue = sum(over, (b) => b.outstanding);
      const over90 = sum(over.filter((b) => (b.overdueDays ?? 0) > 90), (b) => b.outstanding);
      const dated = ledger.filter((b) => b.ageDays != null);
      const wAge = sum(dated, (b) => b.outstanding) ? sum(dated, (b) => b.outstanding * (b.ageDays ?? 0)) / sum(dated, (b) => b.outstanding) : 0;
      const overduePct = pct(overdue, total);
      const health = overduePct < 25 ? "Good (under 25% overdue)" : overduePct <= 50 ? "Needs attention (25-50% overdue)" : "Poor (over 50% overdue)";
      return {
        columns: [COLS.text("metric", "Measure"), COLS.text("value", "Value")],
        rows: [
          { metric: "Total outstanding", value: `Rs ${round0(total).toLocaleString("en-IN")}` },
          { metric: "Open bills", value: ledger.length.toLocaleString("en-IN") },
          { metric: "Overdue amount", value: `Rs ${round0(overdue).toLocaleString("en-IN")}` },
          { metric: "Overdue percentage", value: `${overduePct}%` },
          { metric: "More than 90 days past due", value: `Rs ${round0(over90).toLocaleString("en-IN")}` },
          { metric: "Average age of outstanding (weighted)", value: `${Math.round(wAge)} days` },
          { metric: "Health of outstanding", value: health },
        ],
        note: `Health rule: under 25% overdue is good, 25 to 50% needs attention, over 50% is poor. ${FRESH_NOTE}`,
      };
    },
  },
  {
    id: "out-by-route",
    group: "outstanding",
    category: "Summary & Reports",
    title: "Show outstanding route-wise",
    run: async (ctx) => {
      const pbs = await partyBalances(ctx);
      const rows = [...groupBy(pbs, (p) => p.party.route || "(no route)").entries()]
        .map(([route, g]) => ({
          route,
          parties: g.length,
          bills: sum(g, (p) => p.bills),
          outstanding: round0(sum(g, (p) => p.outstanding)),
          overdue: round0(sum(g, (p) => p.overdue)),
          overduePct: pct(sum(g, (p) => p.overdue), sum(g, (p) => p.outstanding)),
        }))
        .sort((a, b) => b.outstanding - a.outstanding);
      return {
        columns: [COLS.route, COLS.int("parties", "Parties"), COLS.int("bills", "Bills"), COLS.inr("outstanding", "Outstanding"), COLS.inr("overdue", "Overdue"), COLS.pct("overduePct", "Overdue %")],
        rows,
        note: FRESH_NOTE,
      };
    },
  },
  {
    id: "out-by-month",
    group: "outstanding",
    category: "Summary & Reports",
    title: "Show outstanding by invoice month",
    run: async (ctx) => {
      const ledger = await ctx.ledger();
      const rows = [...groupBy(ledger.filter((b) => b.invoiceDate), (b) => (b.invoiceDate as Date).toISOString().slice(0, 7)).entries()]
        .map(([month, g]) => ({ month, bills: g.length, outstanding: round0(sum(g, (b) => b.outstanding)) }))
        .sort((a, b) => (a.month < b.month ? 1 : -1));
      return {
        columns: [COLS.text("month", "Invoice month"), COLS.int("bills", "Bills"), COLS.inr("outstanding", "Still outstanding")],
        rows,
        note: `${FRESH_NOTE} This shows what is still unpaid from each month's invoices, not how the total changed over time.`,
      };
    },
  },
];

export async function outstandingDashboard(ctx: ReportCtx): Promise<Stat[]> {
  const ledger = await ctx.ledger();
  const total = sum(ledger, (b) => b.outstanding);
  const over = overdueRows(ledger);
  const overdue = sum(over, (b) => b.outstanding);
  const overduePct = pct(overdue, total);
  const due7 = ledger.filter((b) => b.overdueDays != null && b.overdueDays <= 0 && b.overdueDays >= -7);
  return [
    { label: "Total outstanding", value: round0(total), format: "inr", hint: `${ledger.length.toLocaleString("en-IN")} open bills` },
    { label: "Overdue", value: round0(overdue), format: "inr", tone: overduePct > 50 ? "bad" : overduePct >= 25 ? "warn" : "good" },
    { label: "Overdue share", value: overduePct, format: "pct", tone: overduePct > 50 ? "bad" : overduePct >= 25 ? "warn" : "good" },
    { label: "Over 90 days past due", value: round0(sum(over.filter((b) => (b.overdueDays ?? 0) > 90), (b) => b.outstanding)), format: "inr", tone: "bad" },
    { label: "Falling due in 7 days", value: round0(sum(due7, (b) => b.outstanding)), format: "inr", hint: `${due7.length} bills` },
  ];
}
