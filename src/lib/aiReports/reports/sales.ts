import type { ReportCtx, ReportDef, ReportResult, SaleLine, Stat } from "../types";
import { COLS, groupBy, istMonthKey, matchesText, pct, round0, sum, toNum } from "../helpers";

const SALES_NOTE =
  "Based on orders placed through the shop app (cancelled orders left out). It is not your full billing sales, so treat it as app sales only.";

interface Agg {
  key: string;
  value: number;
  qty: number;
  orders: number;
}

function aggregate(lines: SaleLine[], keyOf: (l: SaleLine) => string): Agg[] {
  return [...groupBy(lines, keyOf).entries()].map(([key, g]) => ({
    key,
    value: sum(g, (l) => l.value),
    qty: sum(g, (l) => l.quantity),
    orders: g.length,
  }));
}

const itemCols = [COLS.text("name", "Item"), COLS.int("qty", "Quantity"), COLS.inr("value", "Sale value"), COLS.pct("share", "Share of sales")];

function itemRows(aggs: Agg[], total: number) {
  return aggs.map((a) => ({ name: a.key, qty: a.qty, value: round0(a.value), share: pct(a.value, total) }));
}

async function partyName(ctx: ReportCtx) {
  const parties = await ctx.parties();
  return (id: string) => parties.get(id)?.label ?? "(unknown party)";
}

function periodNote(lines: SaleLine[]): string {
  if (lines.length === 0) return `${SALES_NOTE} No orders found.`;
  const min = new Date(Math.min(...lines.map((l) => l.orderedAt.getTime())));
  const max = new Date(Math.max(...lines.map((l) => l.orderedAt.getTime())));
  return `${SALES_NOTE} Orders from ${min.toISOString().slice(0, 10)} to ${max.toISOString().slice(0, 10)}.`;
}

export const salesReports: ReportDef[] = [
  // ---- Item Performance
  {
    id: "sales-top-items",
    group: "sales",
    category: "Item Performance",
    title: "Show top 10 items by sale value",
    run: async (ctx) => {
      const lines = await ctx.sales();
      const total = sum(lines, (l) => l.value);
      const top = aggregate(lines, (l) => l.productName).sort((a, b) => b.value - a.value).slice(0, 10);
      return { columns: itemCols, rows: itemRows(top, total), note: periodNote(lines) };
    },
  },
  {
    id: "sales-bottom-items",
    group: "sales",
    category: "Item Performance",
    title: "Show bottom 10 items by sale value",
    run: async (ctx) => {
      const lines = await ctx.sales();
      const total = sum(lines, (l) => l.value);
      const low = aggregate(lines, (l) => l.productName).filter((a) => a.value > 0).sort((a, b) => a.value - b.value).slice(0, 10);
      return { columns: itemCols, rows: itemRows(low, total), note: `${periodNote(lines)} Only items that sold at least once are listed.` };
    },
  },
  {
    id: "sales-top-qty",
    group: "sales",
    category: "Item Performance",
    title: "Show top 10 items by quantity sold",
    run: async (ctx) => {
      const lines = await ctx.sales();
      const total = sum(lines, (l) => l.value);
      const top = aggregate(lines, (l) => l.productName).sort((a, b) => b.qty - a.qty).slice(0, 10);
      return { columns: itemCols, rows: itemRows(top, total), note: periodNote(lines) };
    },
  },
  {
    id: "sales-item",
    group: "sales",
    category: "Item Performance",
    title: "Show sales for an item",
    params: [{ key: "item", label: "Item name (part of it)", type: "text", placeholder: "e.g. fiesta" }],
    run: async (ctx, raw) => {
      const lines = (await ctx.sales()).filter((l) => matchesText(l.productName, raw.item ?? ""));
      const label = await partyName(ctx);
      const rows = aggregate(lines, (l) => `${l.productName}|||${l.storeId}`)
        .map((a) => {
          const [name, storeId] = a.key.split("|||");
          return { item: name, party: label(storeId), qty: a.qty, value: round0(a.value) };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 300);
      return {
        columns: [COLS.text("item", "Item"), COLS.party, COLS.int("qty", "Quantity"), COLS.inr("value", "Sale value")],
        rows,
        stats: [
          { label: "Quantity sold", value: sum(lines, (l) => l.quantity), format: "int" },
          { label: "Sale value", value: round0(sum(lines, (l) => l.value)), format: "inr" },
        ],
        note: periodNote(await ctx.sales()),
      };
    },
  },

  // ---- Party Performance
  {
    id: "sales-top-parties",
    group: "sales",
    category: "Party Performance",
    title: "Show top 10 parties by purchase value",
    run: async (ctx) => {
      const lines = await ctx.sales();
      const total = sum(lines, (l) => l.value);
      const label = await partyName(ctx);
      const top = aggregate(lines, (l) => l.storeId).sort((a, b) => b.value - a.value).slice(0, 10);
      return {
        columns: [COLS.party, COLS.int("qty", "Quantity"), COLS.inr("value", "Purchase value"), COLS.pct("share", "Share of sales")],
        rows: top.map((a) => ({ party: label(a.key), qty: a.qty, value: round0(a.value), share: pct(a.value, total) })),
        note: periodNote(lines),
      };
    },
  },
  {
    id: "sales-party-items",
    group: "sales",
    category: "Party Performance",
    title: "Show item-wise purchases by a party",
    params: [{ key: "party", label: "Party name (part of it)", type: "text", placeholder: "e.g. sai medical" }],
    run: async (ctx, raw) => {
      const parties = await ctx.parties();
      const ids = new Set([...parties.values()].filter((p) => matchesText(p.name, raw.party ?? "")).map((p) => p.id));
      const lines = (await ctx.sales()).filter((l) => ids.has(l.storeId));
      const total = sum(lines, (l) => l.value);
      const rows = itemRows(aggregate(lines, (l) => l.productName).sort((a, b) => b.value - a.value).slice(0, 300), total);
      return {
        columns: itemCols,
        rows,
        stats: [
          { label: "Parties matched", value: ids.size, format: "int" },
          { label: "Purchase value", value: round0(total), format: "inr" },
        ],
        note: periodNote(await ctx.sales()),
      };
    },
  },

  // ---- Company Analysis
  {
    id: "sales-company",
    group: "sales",
    category: "Company Analysis",
    title: "Show company-wise sales",
    run: async (ctx) => {
      const lines = await ctx.sales();
      const total = sum(lines, (l) => l.value);
      const aggs = aggregate(lines, (l) => l.company).sort((a, b) => b.value - a.value);
      return {
        columns: [COLS.text("company", "Company"), COLS.int("qty", "Quantity"), COLS.inr("value", "Sale value"), COLS.pct("share", "Share of sales")],
        rows: aggs.map((a) => ({ company: a.key, qty: a.qty, value: round0(a.value), share: pct(a.value, total) })),
        note: periodNote(lines),
      };
    },
  },
  {
    id: "sales-company-items",
    group: "sales",
    category: "Company Analysis",
    title: "Show item-wise sales for a company",
    params: [{ key: "company", label: "Company name (part of it)", type: "text", placeholder: "e.g. smart" }],
    run: async (ctx, raw) => {
      const lines = (await ctx.sales()).filter((l) => matchesText(l.company, raw.company ?? ""));
      const total = sum(lines, (l) => l.value);
      return {
        columns: itemCols,
        rows: itemRows(aggregate(lines, (l) => l.productName).sort((a, b) => b.value - a.value).slice(0, 300), total),
        stats: [{ label: "Sale value", value: round0(total), format: "inr" }],
        note: periodNote(await ctx.sales()),
      };
    },
  },
  {
    id: "sales-company-groups",
    group: "sales",
    category: "Company Analysis",
    title: "Show sales by company group (Smart, Smartway, Cureway)",
    run: async (ctx) => {
      const rows = await ctx.db.companySale.groupBy({ by: ["company"], _sum: { amount: true, freeQty: true }, _count: { _all: true }, _max: { periodEnd: true } });
      const total = sum(rows, (r) => Number(r._sum.amount ?? 0));
      return {
        columns: [COLS.text("company", "Company group"), COLS.int("parties", "Parties"), COLS.inr("amount", "Net sales"), COLS.int("free", "Free units"), COLS.pct("share", "Share"), COLS.date("upTo", "Up to")],
        rows: rows
          .map((r) => ({
            company: r.company,
            parties: r._count._all,
            amount: round0(Number(r._sum.amount ?? 0)),
            free: r._sum.freeQty ?? 0,
            share: pct(Number(r._sum.amount ?? 0), total),
            upTo: r._max.periodEnd ? r._max.periodEnd.toISOString().slice(0, 10) : null,
          }))
          .sort((a, b) => b.amount - a.amount),
        note: "From the uploaded company-sales statement (net of returns, before tax). It stops at the date shown.",
      };
    },
  },

  // ---- Business Insights
  {
    id: "sales-concentration",
    group: "sales",
    category: "Business Insights",
    title: "How concentrated are my sales?",
    run: async (ctx) => {
      const lines = await ctx.sales();
      const total = sum(lines, (l) => l.value);
      const items = aggregate(lines, (l) => l.productName).sort((a, b) => b.value - a.value);
      const parties = aggregate(lines, (l) => l.storeId).sort((a, b) => b.value - a.value);
      return {
        columns: [COLS.text("metric", "Measure"), COLS.pct("share", "Share of sales"), COLS.inr("value", "Sale value")],
        rows: [
          { metric: "Top 10 items", share: pct(sum(items.slice(0, 10), (a) => a.value), total), value: round0(sum(items.slice(0, 10), (a) => a.value)) },
          { metric: "Top 10 parties", share: pct(sum(parties.slice(0, 10), (a) => a.value), total), value: round0(sum(parties.slice(0, 10), (a) => a.value)) },
          { metric: "Top 1 item", share: pct(items[0]?.value ?? 0, total), value: round0(items[0]?.value ?? 0) },
          { metric: "Top 1 party", share: pct(parties[0]?.value ?? 0, total), value: round0(parties[0]?.value ?? 0) },
        ],
        note: periodNote(lines),
      };
    },
  },
  {
    id: "sales-top-combos",
    group: "sales",
    category: "Business Insights",
    title: "Show top 10 item and party combinations",
    run: async (ctx) => {
      const lines = await ctx.sales();
      const label = await partyName(ctx);
      const total = sum(lines, (l) => l.value);
      const top = aggregate(lines, (l) => `${l.productName}|||${l.storeId}`).sort((a, b) => b.value - a.value).slice(0, 10);
      return {
        columns: [COLS.text("item", "Item"), COLS.party, COLS.int("qty", "Quantity"), COLS.inr("value", "Sale value"), COLS.pct("share", "Share of sales")],
        rows: top.map((a) => {
          const [name, id] = a.key.split("|||");
          return { item: name, party: label(id), qty: a.qty, value: round0(a.value), share: pct(a.value, total) };
        }),
        note: periodNote(lines),
      };
    },
  },
  {
    id: "sales-low-items",
    group: "sales",
    category: "Business Insights",
    title: "Show slow items with sale value below ?",
    params: [{ key: "max", label: "Sale value below (Rs)", type: "number", placeholder: "e.g. 500" }],
    run: async (ctx, raw) => {
      const max = toNum(raw.max);
      if (max == null) return { columns: [], rows: [], note: "Enter a valid amount." };
      const lines = await ctx.sales();
      const total = sum(lines, (l) => l.value);
      const low = aggregate(lines, (l) => l.productName).filter((a) => a.value < max).sort((a, b) => a.value - b.value);
      return { columns: itemCols, rows: itemRows(low.slice(0, 500), total), stats: [{ label: "Items", value: low.length, format: "int" }], note: periodNote(lines) };
    },
  },

  // ---- Sales Overview
  {
    id: "sales-overview",
    group: "sales",
    category: "Sales Overview",
    title: "Sales overview",
    run: async (ctx) => {
      const orders = await ctx.db.order.aggregate({ where: { status: { not: "CANCELLED" } }, _count: { _all: true }, _sum: { totalAmount: true }, _min: { createdAt: true }, _max: { createdAt: true } });
      const lines = await ctx.sales();
      const count = orders._count._all;
      const value = Number(orders._sum.totalAmount ?? 0);
      return {
        columns: [COLS.text("metric", "Measure"), COLS.text("value", "Value")],
        rows: [
          { metric: "Orders", value: count.toLocaleString("en-IN") },
          { metric: "Order value", value: `Rs ${round0(value).toLocaleString("en-IN")}` },
          { metric: "Average order", value: `Rs ${round0(count ? value / count : 0).toLocaleString("en-IN")}` },
          { metric: "Parties who ordered", value: new Set(lines.map((l) => l.storeId)).size.toLocaleString("en-IN") },
          { metric: "Items sold (distinct)", value: new Set(lines.map((l) => l.productId)).size.toLocaleString("en-IN") },
          { metric: "First order", value: orders._min.createdAt ? orders._min.createdAt.toISOString().slice(0, 10) : "-" },
          { metric: "Latest order", value: orders._max.createdAt ? orders._max.createdAt.toISOString().slice(0, 10) : "-" },
        ],
        note: SALES_NOTE,
      };
    },
  },
  {
    id: "sales-by-month",
    group: "sales",
    category: "Sales Overview",
    title: "Show sales month-wise",
    run: async (ctx) => {
      const lines = await ctx.sales();
      const rows = [...groupBy(lines, (l) => istMonthKey(l.orderedAt)).entries()]
        .map(([month, g]) => ({ month, qty: sum(g, (l) => l.quantity), value: round0(sum(g, (l) => l.value)), parties: new Set(g.map((l) => l.storeId)).size }))
        .sort((a, b) => (a.month < b.month ? 1 : -1));
      return {
        columns: [COLS.text("month", "Month"), COLS.int("parties", "Parties ordering"), COLS.int("qty", "Quantity"), COLS.inr("value", "Sale value")],
        rows,
        note: periodNote(lines),
      };
    },
  },
  {
    id: "sales-by-weekday",
    group: "sales",
    category: "Sales Overview",
    title: "Show sales by day of the week",
    run: async (ctx) => {
      const lines = await ctx.sales();
      const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const total = sum(lines, (l) => l.value);
      const rows = names.map((name, d) => {
        const g = lines.filter((l) => new Date(l.orderedAt.getTime() + 5.5 * 3600e3).getUTCDay() === d);
        return { day: name, value: round0(sum(g, (l) => l.value)), share: pct(sum(g, (l) => l.value), total) };
      });
      return { columns: [COLS.text("day", "Day"), COLS.inr("value", "Sale value"), COLS.pct("share", "Share of sales")], rows, note: periodNote(lines) };
    },
  },
];

export async function salesDashboard(ctx: ReportCtx): Promise<Stat[]> {
  const lines = await ctx.sales();
  const total = sum(lines, (l) => l.value);
  const orders = await ctx.db.order.aggregate({ where: { status: { not: "CANCELLED" } }, _count: { _all: true } });
  const items = aggregate(lines, (l) => l.productName).sort((a, b) => b.value - a.value);
  const parties = aggregate(lines, (l) => l.storeId).sort((a, b) => b.value - a.value);
  return [
    { label: "App sales", value: round0(total), format: "inr", hint: `${orders._count._all.toLocaleString("en-IN")} orders` },
    { label: "Average order", value: round0(orders._count._all ? total / orders._count._all : 0), format: "inr" },
    { label: "Top 10 items share", value: pct(sum(items.slice(0, 10), (a) => a.value), total), format: "pct" },
    { label: "Top 10 parties share", value: pct(sum(parties.slice(0, 10), (a) => a.value), total), format: "pct" },
    { label: "Parties who ordered", value: parties.length, format: "int" },
  ];
}

export type { ReportResult };
