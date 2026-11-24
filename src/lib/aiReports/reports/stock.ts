import type { ProductInfo, ReportCtx, ReportDef, Stat } from "../types";
import { COLS, groupBy, matchesText, round0, round2, sum } from "../helpers";

export const HIGH_VALUE_PRICE = 500; // selling price from which an item counts as "high value"
export const LOW_STOCK_BELOW = 10;

export const stockValue = (p: ProductInfo): number | null =>
  p.stock != null && p.stock > 0 && p.purchaseRate != null ? p.stock * p.purchaseRate : null;

async function activeProducts(ctx: ReportCtx) {
  return (await ctx.products()).filter((p) => p.active);
}

function valueNote(products: ProductInfo[]): string {
  const missing = products.filter((p) => p.stock != null && p.stock > 0 && p.purchaseRate == null).length;
  return `Stock value is stock x purchase rate. ${missing.toLocaleString("en-IN")} items in stock have no purchase rate, so they are left out of every value. Stock comes from the last stock upload.`;
}

const itemCols = [
  COLS.text("name", "Item"),
  COLS.text("company", "Company"),
  COLS.int("stock", "Stock"),
  { key: "rate", label: "Purchase rate", format: "decimal" as const },
  COLS.inr("value", "Stock value"),
];

function itemRow(p: ProductInfo) {
  return { name: p.name, company: p.company, stock: p.stock, rate: p.purchaseRate, value: stockValue(p) == null ? null : round0(stockValue(p) as number) };
}

const plainCols = [COLS.text("name", "Item"), COLS.text("company", "Company"), COLS.int("stock", "Stock"), { key: "price", label: "Selling price", format: "decimal" as const }];
const plainRow = (p: ProductInfo) => ({ name: p.name, company: p.company, stock: p.stock, price: p.price });

export const stockReports: ReportDef[] = [
  // ---- Item Analysis & Rankings
  {
    id: "stock-top-value",
    group: "stock",
    category: "Item Analysis & Rankings",
    title: "Show top 20 items by stock value",
    run: async (ctx) => {
      const ps = await activeProducts(ctx);
      const top = ps.filter((p) => stockValue(p) != null).sort((a, b) => (stockValue(b) as number) - (stockValue(a) as number)).slice(0, 20);
      return { columns: itemCols, rows: top.map(itemRow), note: valueNote(ps) };
    },
  },
  {
    id: "stock-top-qty",
    group: "stock",
    category: "Item Analysis & Rankings",
    title: "Show top 20 items by stock quantity",
    run: async (ctx) => {
      const ps = await activeProducts(ctx);
      const top = ps.filter((p) => (p.stock ?? 0) > 0).sort((a, b) => (b.stock as number) - (a.stock as number)).slice(0, 20);
      return { columns: itemCols, rows: top.map(itemRow), note: valueNote(ps) };
    },
  },
  {
    id: "stock-item",
    group: "stock",
    category: "Item Analysis & Rankings",
    title: "Show stock and value of an item",
    params: [{ key: "item", label: "Item name (part of it)", type: "text", placeholder: "e.g. fiesta banana" }],
    run: async (ctx, raw) => {
      const ps = await activeProducts(ctx);
      const hits = ps.filter((p) => matchesText(p.name, raw.item ?? "")).slice(0, 300);
      return { columns: itemCols, rows: hits.map(itemRow), note: valueNote(ps) };
    },
  },

  // ---- Company Analysis
  {
    id: "stock-company-value",
    group: "stock",
    category: "Company Analysis",
    title: "Show company-wise stock value",
    run: async (ctx) => {
      const ps = await activeProducts(ctx);
      const total = sum(ps, (p) => stockValue(p) ?? 0);
      const rows = [...groupBy(ps, (p) => p.company).entries()]
        .map(([company, g]) => ({
          company,
          items: g.filter((p) => (p.stock ?? 0) > 0).length,
          qty: sum(g, (p) => Math.max(p.stock ?? 0, 0)),
          value: round0(sum(g, (p) => stockValue(p) ?? 0)),
          share: total ? round2((sum(g, (p) => stockValue(p) ?? 0) / total) * 100) : 0,
        }))
        .filter((r) => r.items > 0)
        .sort((a, b) => b.value - a.value);
      return {
        columns: [COLS.text("company", "Company"), COLS.int("items", "Items in stock"), COLS.int("qty", "Units"), COLS.inr("value", "Stock value"), COLS.pct("share", "Share")],
        rows,
        note: valueNote(ps),
      };
    },
  },
  {
    id: "stock-company-qty",
    group: "stock",
    category: "Company Analysis",
    title: "Show top 10 companies by stock quantity",
    run: async (ctx) => {
      const ps = await activeProducts(ctx);
      const rows = [...groupBy(ps, (p) => p.company).entries()]
        .map(([company, g]) => ({ company, items: g.filter((p) => (p.stock ?? 0) > 0).length, qty: sum(g, (p) => Math.max(p.stock ?? 0, 0)), value: round0(sum(g, (p) => stockValue(p) ?? 0)) }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);
      return { columns: [COLS.text("company", "Company"), COLS.int("items", "Items in stock"), COLS.int("qty", "Units"), COLS.inr("value", "Stock value")], rows, note: valueNote(ps) };
    },
  },
  {
    id: "stock-company",
    group: "stock",
    category: "Company Analysis",
    title: "Show stock of a company",
    params: [{ key: "company", label: "Company name (part of it)", type: "text", placeholder: "e.g. dkt" }],
    run: async (ctx, raw) => {
      const ps = await activeProducts(ctx);
      const hits = ps.filter((p) => matchesText(p.company, raw.company ?? "")).sort((a, b) => (stockValue(b) ?? 0) - (stockValue(a) ?? 0));
      return {
        columns: itemCols,
        rows: hits.slice(0, 500).map(itemRow),
        stats: [
          { label: "Items", value: hits.length, format: "int" },
          { label: "Stock value", value: round0(sum(hits, (p) => stockValue(p) ?? 0)), format: "inr" },
        ],
        note: valueNote(ps),
      };
    },
  },

  // ---- Alerts & Shortages
  {
    id: "stock-zero",
    group: "stock",
    category: "Alerts & Shortages",
    title: "Show items with zero stock",
    run: async (ctx) => {
      const ps = (await activeProducts(ctx)).filter((p) => p.stock === 0).sort((a, b) => b.price - a.price);
      return {
        columns: plainCols,
        rows: ps.slice(0, 1000).map(plainRow),
        stats: [{ label: "Items at zero", value: ps.length, format: "int" }],
        note: ps.length > 1000 ? "Showing the 1,000 highest-priced items. Download for the same list." : "Highest selling price first.",
      };
    },
  },
  {
    id: "stock-negative",
    group: "stock",
    category: "Alerts & Shortages",
    title: "Show items with negative stock",
    run: async (ctx) => {
      const ps = (await activeProducts(ctx)).filter((p) => (p.stock ?? 0) < 0);
      return { columns: plainCols, rows: ps.map(plainRow), stats: [{ label: "Items below zero", value: ps.length, format: "int", tone: ps.length ? "bad" : "good" }] };
    },
  },
  {
    id: "stock-low",
    group: "stock",
    category: "Alerts & Shortages",
    title: `Show items with stock below ${LOW_STOCK_BELOW}`,
    run: async (ctx) => {
      const ps = (await activeProducts(ctx)).filter((p) => (p.stock ?? 0) > 0 && (p.stock as number) < LOW_STOCK_BELOW).sort((a, b) => (a.stock as number) - (b.stock as number));
      return { columns: plainCols, rows: ps.map(plainRow), stats: [{ label: "Low stock items", value: ps.length, format: "int" }], note: "Stock of 1 to 9 units. Zero stock is a separate report." };
    },
  },
  {
    id: "stock-high-value-low",
    group: "stock",
    category: "Alerts & Shortages",
    title: "Show high value items with low stock",
    run: async (ctx) => {
      const ps = (await activeProducts(ctx))
        .filter((p) => (p.stock ?? 0) > 0 && (p.stock as number) < LOW_STOCK_BELOW && p.price >= HIGH_VALUE_PRICE)
        .sort((a, b) => b.price - a.price);
      return {
        columns: plainCols,
        rows: ps.map(plainRow),
        stats: [{ label: "Items", value: ps.length, format: "int" }],
        note: `High value means a selling price of Rs ${HIGH_VALUE_PRICE} or more, with 1 to ${LOW_STOCK_BELOW - 1} units left.`,
      };
    },
  },
  {
    id: "stock-not-set",
    group: "stock",
    category: "Alerts & Shortages",
    title: "Show items whose stock is not set",
    run: async (ctx) => {
      const ps = (await activeProducts(ctx)).filter((p) => p.stock == null);
      return {
        columns: plainCols,
        rows: ps.slice(0, 1000).map(plainRow),
        stats: [{ label: "Items with no stock figure", value: ps.length, format: "int", tone: ps.length ? "warn" : "good" }],
        note: "These items were not in the last stock upload, so we cannot say whether they are in stock.",
      };
    },
  },

  // ---- Stock Summary & Reports
  {
    id: "stock-summary",
    group: "stock",
    category: "Stock Summary & Reports",
    title: "Total stock value and stock summary",
    run: async (ctx) => {
      const ps = await activeProducts(ctx);
      const inStock = ps.filter((p) => (p.stock ?? 0) > 0);
      return {
        columns: [COLS.text("metric", "Measure"), COLS.text("value", "Value")],
        rows: [
          { metric: "Total stock value", value: `Rs ${round0(sum(ps, (p) => stockValue(p) ?? 0)).toLocaleString("en-IN")}` },
          { metric: "Active items", value: ps.length.toLocaleString("en-IN") },
          { metric: "Items in stock", value: inStock.length.toLocaleString("en-IN") },
          { metric: "Items at zero stock", value: ps.filter((p) => p.stock === 0).length.toLocaleString("en-IN") },
          { metric: "Items with negative stock", value: ps.filter((p) => (p.stock ?? 0) < 0).length.toLocaleString("en-IN") },
          { metric: `Items with stock below ${LOW_STOCK_BELOW}`, value: ps.filter((p) => (p.stock ?? 0) > 0 && (p.stock as number) < LOW_STOCK_BELOW).length.toLocaleString("en-IN") },
          { metric: "Items with no stock figure", value: ps.filter((p) => p.stock == null).length.toLocaleString("en-IN") },
          { metric: "Items in stock without a purchase rate", value: inStock.filter((p) => p.purchaseRate == null).length.toLocaleString("en-IN") },
        ],
        note: valueNote(ps),
      };
    },
  },
];

export async function stockDashboard(ctx: ReportCtx): Promise<Stat[]> {
  const ps = await activeProducts(ctx);
  const inStock = ps.filter((p) => (p.stock ?? 0) > 0);
  const zero = ps.filter((p) => p.stock === 0).length;
  const low = ps.filter((p) => (p.stock ?? 0) > 0 && (p.stock as number) < LOW_STOCK_BELOW).length;
  return [
    { label: "Stock value", value: round0(sum(ps, (p) => stockValue(p) ?? 0)), format: "inr", hint: "stock x purchase rate" },
    { label: "Items in stock", value: inStock.length, format: "int", hint: `of ${ps.length.toLocaleString("en-IN")} active items` },
    { label: "Zero stock", value: zero, format: "int", tone: "warn" },
    { label: "Low stock (under 10)", value: low, format: "int", tone: "warn" },
    { label: "In stock, no purchase rate", value: inStock.filter((p) => p.purchaseRate == null).length, format: "int", tone: "warn" },
  ];
}
