import type { ProductInfo, ReportCtx, ReportDef, Stat } from "../types";
import { COLS, dateCell, groupBy, matchesText, pct, round0, round2, sum } from "../helpers";
import { stockValue } from "./stock";

const DAY_MS = 24 * 60 * 60 * 1000;

const EXPIRY_NOTE =
  "Expiry is the soonest expiry date per item from the last stock upload, not batch by batch. An item with several batches shows only its earliest date. Our data has no supplier bills.";
const MARGIN_NOTE =
  "Margin is selling price minus purchase rate, as a percentage of selling price. Only items with both rates are included. Special-rate shops pay less than this selling price.";

async function activeProducts(ctx: ReportCtx) {
  return (await ctx.products()).filter((p) => p.active);
}

const daysTo = (d: Date, today: Date) => Math.floor((d.getTime() - today.getTime()) / DAY_MS);

const expiryCols = [
  COLS.text("name", "Item"),
  COLS.text("company", "Company"),
  COLS.date("expiry", "Nearest expiry"),
  COLS.int("days", "Days left"),
  COLS.int("stock", "Stock"),
  COLS.inr("value", "Stock value"),
];

function expiryRow(p: ProductInfo, today: Date) {
  return {
    name: p.name,
    company: p.company,
    expiry: dateCell(p.nearestExpiry),
    days: p.nearestExpiry ? daysTo(p.nearestExpiry, today) : null,
    stock: p.stock,
    value: stockValue(p) == null ? null : round0(stockValue(p) as number),
  };
}

function expiring(id: string, title: string, days: number): ReportDef {
  return {
    id,
    group: "batch",
    category: "Batch & Expiry Analysis",
    title,
    run: async (ctx) => {
      const ps = (await activeProducts(ctx))
        .filter((p) => p.nearestExpiry && (p.stock ?? 0) > 0 && daysTo(p.nearestExpiry, ctx.today) >= 0 && daysTo(p.nearestExpiry, ctx.today) <= days)
        .sort((a, b) => (a.nearestExpiry as Date).getTime() - (b.nearestExpiry as Date).getTime());
      return {
        columns: expiryCols,
        rows: ps.map((p) => expiryRow(p, ctx.today)),
        stats: [
          { label: "Items", value: ps.length, format: "int" },
          { label: "Stock value", value: round0(sum(ps, (p) => stockValue(p) ?? 0)), format: "inr" },
        ],
        note: EXPIRY_NOTE,
      };
    },
  };
}

const marginOf = (p: ProductInfo): number | null =>
  p.purchaseRate != null && p.price > 0 ? ((p.price - p.purchaseRate) / p.price) * 100 : null;

const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// Below -100% means the selling price is less than half the purchase rate, which
// in this data is nearly always a pack-size mismatch (price per piece against a
// purchase rate per pack), not a real loss.
const likelyUnitMismatch = (p: ProductInfo) => (marginOf(p) ?? 0) < -100;

const marginCols = [
  COLS.text("name", "Item"),
  COLS.text("company", "Company"),
  { key: "price", label: "Selling price", format: "decimal" as const },
  { key: "rate", label: "Purchase rate", format: "decimal" as const },
  COLS.pct("margin", "Margin"),
  COLS.int("stock", "Stock"),
];

const marginRow = (p: ProductInfo) => ({ name: p.name, company: p.company, price: p.price, rate: p.purchaseRate, margin: round2(marginOf(p) ?? 0), stock: p.stock });

export const batchReports: ReportDef[] = [
  // ---- Company & Supplier Analysis
  {
    id: "batch-supplier-value",
    group: "batch",
    category: "Company & Supplier Analysis",
    title: "Show top 10 companies (suppliers) by stock value",
    run: async (ctx) => {
      const ps = await activeProducts(ctx);
      const total = sum(ps, (p) => stockValue(p) ?? 0);
      const rows = [...groupBy(ps, (p) => p.company).entries()]
        .map(([company, g]) => ({ company, value: round0(sum(g, (p) => stockValue(p) ?? 0)), share: total ? round2((sum(g, (p) => stockValue(p) ?? 0) / total) * 100) : 0 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      return {
        columns: [COLS.text("company", "Company"), COLS.inr("value", "Stock value"), COLS.pct("share", "Share of stock")],
        rows,
        note: "A company here is the maker or brand each item belongs to. We do not hold supplier bills, so bill-wise supplier reports are not possible.",
      };
    },
  },
  {
    id: "batch-company-expiry",
    group: "batch",
    category: "Company & Supplier Analysis",
    title: "Show companies with the most expiring or expired stock",
    run: async (ctx) => {
      const ps = (await activeProducts(ctx)).filter((p) => p.nearestExpiry && (p.stock ?? 0) > 0 && daysTo(p.nearestExpiry, ctx.today) <= 90);
      const rows = [...groupBy(ps, (p) => p.company).entries()]
        .map(([company, g]) => ({
          company,
          items: g.length,
          expired: round0(sum(g.filter((p) => daysTo(p.nearestExpiry as Date, ctx.today) < 0), (p) => stockValue(p) ?? 0)),
          soon: round0(sum(g.filter((p) => daysTo(p.nearestExpiry as Date, ctx.today) >= 0), (p) => stockValue(p) ?? 0)),
        }))
        .sort((a, b) => b.expired + b.soon - (a.expired + a.soon))
        .slice(0, 25);
      return {
        columns: [COLS.text("company", "Company"), COLS.int("items", "Items"), COLS.inr("expired", "Already expired"), COLS.inr("soon", "Expiring in 90 days")],
        rows,
        note: EXPIRY_NOTE,
      };
    },
  },

  // ---- Batch & Expiry Analysis
  expiring("exp-30", "Show items expiring in the next 30 days", 30),
  expiring("exp-60", "Show items expiring in the next 60 days", 60),
  expiring("exp-90", "Show items expiring in the next 90 days", 90),
  {
    id: "exp-expired",
    group: "batch",
    category: "Batch & Expiry Analysis",
    title: "Show items already expired",
    run: async (ctx) => {
      const ps = (await activeProducts(ctx))
        .filter((p) => p.nearestExpiry && (p.stock ?? 0) > 0 && daysTo(p.nearestExpiry, ctx.today) < 0)
        .sort((a, b) => (stockValue(b) ?? 0) - (stockValue(a) ?? 0));
      return {
        columns: expiryCols,
        rows: ps.map((p) => expiryRow(p, ctx.today)),
        stats: [
          { label: "Items", value: ps.length, format: "int", tone: ps.length ? "bad" : "good" },
          { label: "Expired stock value", value: round0(sum(ps, (p) => stockValue(p) ?? 0)), format: "inr", tone: "bad" },
        ],
        note: EXPIRY_NOTE,
      };
    },
  },
  {
    id: "exp-by-month",
    group: "batch",
    category: "Batch & Expiry Analysis",
    title: "Show expiry-wise stock quantity and value (by month)",
    run: async (ctx) => {
      const ps = (await activeProducts(ctx)).filter((p) => p.nearestExpiry && (p.stock ?? 0) > 0);
      const rows = [...groupBy(ps, (p) => (p.nearestExpiry as Date).toISOString().slice(0, 7)).entries()]
        .map(([month, g]) => ({ month, items: g.length, qty: sum(g, (p) => p.stock ?? 0), value: round0(sum(g, (p) => stockValue(p) ?? 0)) }))
        .sort((a, b) => (a.month < b.month ? -1 : 1));
      return {
        columns: [COLS.text("month", "Expiry month"), COLS.int("items", "Items"), COLS.int("qty", "Units"), COLS.inr("value", "Stock value")],
        rows,
        note: EXPIRY_NOTE,
      };
    },
  },
  {
    id: "exp-item",
    group: "batch",
    category: "Batch & Expiry Analysis",
    title: "Show expiry of an item",
    params: [{ key: "item", label: "Item name (part of it)", type: "text", placeholder: "e.g. calci" }],
    run: async (ctx, raw) => {
      const ps = (await activeProducts(ctx)).filter((p) => p.nearestExpiry && matchesText(p.name, raw.item ?? "")).slice(0, 300);
      return { columns: expiryCols, rows: ps.map((p) => expiryRow(p, ctx.today)), note: EXPIRY_NOTE };
    },
  },

  // ---- Deals & Margin Analysis
  {
    id: "margin-top",
    group: "batch",
    category: "Deals & Margin Analysis",
    title: "Show top 25 items by margin",
    run: async (ctx) => {
      const ps = (await activeProducts(ctx))
        .filter((p) => marginOf(p) != null && (p.stock ?? 0) > 0)
        .sort((a, b) => (marginOf(b) as number) - (marginOf(a) as number))
        .slice(0, 25);
      return { columns: marginCols, rows: ps.map(marginRow), note: `${MARGIN_NOTE} Items in stock only.` };
    },
  },
  {
    id: "margin-negative",
    group: "batch",
    category: "Deals & Margin Analysis",
    title: "Show items where selling price is below purchase rate (check these)",
    run: async (ctx) => {
      const ps = (await activeProducts(ctx)).filter((p) => p.purchaseRate != null && p.price > 0 && p.price < p.purchaseRate).sort((a, b) => (marginOf(a) as number) - (marginOf(b) as number));
      const mismatch = ps.filter(likelyUnitMismatch).length;
      return {
        columns: [...marginCols, COLS.text("check", "Likely reason")],
        rows: ps.map((p) => ({ ...marginRow(p), check: likelyUnitMismatch(p) ? "Pack size differs between the two rates" : "Selling below cost, or an old rate" })),
        stats: [
          { label: "Items below purchase rate", value: ps.length, format: "int", tone: ps.length ? "warn" : "good" },
          { label: "Probably pack-size mismatch", value: mismatch, format: "int", hint: "margin below -100%" },
          { label: "Possibly a real loss", value: ps.length - mismatch, format: "int", tone: ps.length - mismatch ? "bad" : "good" },
        ],
        note: `${MARGIN_NOTE} Most of the worst ones are a data problem: the selling price is per piece while the purchase rate is per pack, or the reverse. Fix the rate in the product list and they drop off.`,
      };
    },
  },
  {
    id: "margin-low",
    group: "batch",
    category: "Deals & Margin Analysis",
    title: "Show items with margin under 5%",
    run: async (ctx) => {
      const ps = (await activeProducts(ctx)).filter((p) => marginOf(p) != null && (marginOf(p) as number) >= 0 && (marginOf(p) as number) < 5 && (p.stock ?? 0) > 0).sort((a, b) => (marginOf(a) as number) - (marginOf(b) as number));
      return { columns: marginCols, rows: ps.map(marginRow), stats: [{ label: "Items", value: ps.length, format: "int" }], note: `${MARGIN_NOTE} Items in stock only.` };
    },
  },
  {
    id: "margin-company",
    group: "batch",
    category: "Deals & Margin Analysis",
    title: "Show typical margin by company",
    run: async (ctx) => {
      const ps = (await activeProducts(ctx)).filter((p) => marginOf(p) != null);
      const rows = [...groupBy(ps, (p) => p.company).entries()]
        .filter(([, g]) => g.length >= 3)
        .map(([company, g]) => ({ company, items: g.length, margin: round2(median(g.map((p) => marginOf(p) as number))) }))
        .sort((a, b) => b.margin - a.margin);
      return {
        columns: [COLS.text("company", "Company"), COLS.int("items", "Items with both rates"), COLS.pct("margin", "Typical margin (median)")],
        rows,
        note: `${MARGIN_NOTE} Companies with fewer than 3 priced items are left out. The median item margin is used so a few wrong rates do not distort a company. It is not weighted by sales.`,
      };
    },
  },

  // ---- Summary & Analysis
  {
    id: "batch-summary",
    group: "batch",
    category: "Summary & Analysis",
    title: "Expiry and margin summary",
    run: async (ctx) => {
      const ps = await activeProducts(ctx);
      const withExpiry = ps.filter((p) => p.nearestExpiry && (p.stock ?? 0) > 0);
      const expired = withExpiry.filter((p) => daysTo(p.nearestExpiry as Date, ctx.today) < 0);
      const soon = withExpiry.filter((p) => daysTo(p.nearestExpiry as Date, ctx.today) >= 0 && daysTo(p.nearestExpiry as Date, ctx.today) <= 30);
      const priced = ps.filter((p) => marginOf(p) != null);
      return {
        columns: [COLS.text("metric", "Measure"), COLS.text("value", "Value")],
        rows: [
          { metric: "Items in stock with an expiry date", value: withExpiry.length.toLocaleString("en-IN") },
          { metric: "Already expired: items", value: expired.length.toLocaleString("en-IN") },
          { metric: "Already expired: stock value", value: `Rs ${round0(sum(expired, (p) => stockValue(p) ?? 0)).toLocaleString("en-IN")}` },
          { metric: "Expiring in 30 days: items", value: soon.length.toLocaleString("en-IN") },
          { metric: "Expiring in 30 days: stock value", value: `Rs ${round0(sum(soon, (p) => stockValue(p) ?? 0)).toLocaleString("en-IN")}` },
          { metric: "Items with both rates", value: priced.length.toLocaleString("en-IN") },
          { metric: "Typical margin (median item)", value: `${round2(median(priced.map((p) => marginOf(p) as number)))}%` },
          { metric: "Below purchase rate (mostly a data check)", value: priced.filter((p) => (marginOf(p) as number) < 0).length.toLocaleString("en-IN") },
          { metric: "Of those, probably a pack-size mismatch", value: priced.filter(likelyUnitMismatch).length.toLocaleString("en-IN") },
        ],
        note: `${EXPIRY_NOTE} ${MARGIN_NOTE}`,
      };
    },
  },
];

export async function batchDashboard(ctx: ReportCtx): Promise<Stat[]> {
  const ps = await activeProducts(ctx);
  const withExpiry = ps.filter((p) => p.nearestExpiry && (p.stock ?? 0) > 0);
  const expired = withExpiry.filter((p) => daysTo(p.nearestExpiry as Date, ctx.today) < 0);
  const soon = withExpiry.filter((p) => daysTo(p.nearestExpiry as Date, ctx.today) >= 0 && daysTo(p.nearestExpiry as Date, ctx.today) <= 30);
  const priced = ps.filter((p) => marginOf(p) != null);
  return [
    { label: "Expired stock value", value: round0(sum(expired, (p) => stockValue(p) ?? 0)), format: "inr", hint: `${expired.length} items`, tone: expired.length ? "bad" : "good" },
    { label: "Expiring in 30 days", value: round0(sum(soon, (p) => stockValue(p) ?? 0)), format: "inr", hint: `${soon.length} items`, tone: soon.length ? "warn" : "good" },
    { label: "Items with expiry date", value: withExpiry.length, format: "int", hint: `${pct(withExpiry.length, ps.filter((p) => (p.stock ?? 0) > 0).length)}% of items in stock` },
    { label: "Typical margin (median)", value: round2(median(priced.map((p) => marginOf(p) as number))), format: "pct" },
    { label: "Below purchase rate", value: priced.filter((p) => (marginOf(p) as number) < 0).length, format: "int", tone: "warn", hint: `${priced.filter(likelyUnitMismatch).length} are probably pack-size mismatches` },
  ];
}
