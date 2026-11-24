import type { ReportCtx, ReportDef, Stat } from "../types";
import { COLS, overdueRows, partyBalances, pct, round0, sum } from "../helpers";
import { outstandingReports } from "./outstanding";
import { batchDashboard } from "./batch";
import { stockDashboard, stockValue } from "./stock";
import { DEFAULT_CREDIT_DAYS } from "../ctx";

const inr = (n: number) => `Rs ${round0(n).toLocaleString("en-IN")}`;
const lakh = (n: number) => (Math.abs(n) >= 100000 ? `Rs ${(n / 100000).toFixed(1)} lakh` : inr(n));

function reuse(id: string, title: string, from: string): ReportDef {
  const base = outstandingReports.find((r) => r.id === from) as ReportDef;
  return { ...base, id, group: "tools", category: "Account tools", title };
}

const dailySummary: ReportDef = {
  id: "tool-daily-summary",
  group: "tools",
  category: "Daily summary",
  title: "Daily summary (ready to paste into WhatsApp)",
  run: async (ctx) => {
    const [ledger, pbs, products] = await Promise.all([ctx.ledger(), partyBalances(ctx), ctx.products()]);
    const total = sum(ledger, (b) => b.outstanding);
    const over = overdueRows(ledger);
    const overdue = sum(over, (b) => b.outstanding);
    const due7 = sum(ledger.filter((b) => b.overdueDays != null && b.overdueDays <= 0 && b.overdueDays >= -7), (b) => b.outstanding);

    const startOfMonthIst = new Date(ctx.today.getTime());
    startOfMonthIst.setTime(Date.UTC(new Date(ctx.today.getTime() + 5.5 * 3600e3).getUTCFullYear(), new Date(ctx.today.getTime() + 5.5 * 3600e3).getUTCMonth(), 1) - 5.5 * 3600e3);
    const [todayOrders, monthOrders] = await Promise.all([
      ctx.db.order.aggregate({ where: { status: { not: "CANCELLED" }, createdAt: { gte: ctx.today } }, _count: { _all: true }, _sum: { totalAmount: true } }),
      ctx.db.order.aggregate({ where: { status: { not: "CANCELLED" }, createdAt: { gte: startOfMonthIst } }, _count: { _all: true }, _sum: { totalAmount: true } }),
    ]);

    const active = products.filter((p) => p.active);
    const zero = active.filter((p) => p.stock === 0).length;
    const day = 24 * 60 * 60 * 1000;
    const expiring = active.filter((p) => p.nearestExpiry && (p.stock ?? 0) > 0);
    const expired = expiring.filter((p) => (p.nearestExpiry as Date).getTime() < ctx.today.getTime());
    const soon = expiring.filter((p) => {
      const d = Math.floor(((p.nearestExpiry as Date).getTime() - ctx.today.getTime()) / day);
      return d >= 0 && d <= 30;
    });
    const call = pbs
      .filter((p) => p.overdue > 0)
      .map((p) => ({ p, score: p.overdue * (1 + p.oldestOverdueDays / 180) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const dateLabel = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }).format(new Date());
    const lines = [
      `J P Traders: daily summary, ${dateLabel}`,
      "",
      `Outstanding: ${lakh(total)} (${pct(overdue, total)}% older than ${DEFAULT_CREDIT_DAYS} days)`,
      `Falling due in 7 days: ${lakh(due7)}`,
      `Orders today: ${todayOrders._count._all} (${inr(Number(todayOrders._sum.totalAmount ?? 0))})`,
      `Orders this month: ${monthOrders._count._all} (${inr(Number(monthOrders._sum.totalAmount ?? 0))})`,
      `Stock value: ${lakh(sum(active, (p) => stockValue(p) ?? 0))}, ${zero.toLocaleString("en-IN")} items at zero`,
      `Expired stock: ${inr(sum(expired, (p) => stockValue(p) ?? 0))}; expiring in 30 days: ${inr(sum(soon, (p) => stockValue(p) ?? 0))}`,
      "",
      "Call first today:",
      ...call.map(({ p }, i) => `${i + 1}. ${p.party.name}${p.party.phone ? ` (${p.party.phone})` : ""}: ${inr(p.overdue)} overdue`),
    ];

    return {
      columns: [COLS.text("metric", "Measure"), COLS.text("value", "Value")],
      rows: [
        { metric: "Outstanding", value: `${lakh(total)} (${pct(overdue, total)}% older than ${DEFAULT_CREDIT_DAYS} days)` },
        { metric: "Falling due in 7 days", value: lakh(due7) },
        { metric: "Orders today", value: `${todayOrders._count._all} (${inr(Number(todayOrders._sum.totalAmount ?? 0))})` },
        { metric: "Orders this month", value: `${monthOrders._count._all} (${inr(Number(monthOrders._sum.totalAmount ?? 0))})` },
        { metric: "Stock value", value: lakh(sum(active, (p) => stockValue(p) ?? 0)) },
        { metric: "Items at zero stock", value: zero.toLocaleString("en-IN") },
        { metric: "Expired stock value", value: inr(sum(expired, (p) => stockValue(p) ?? 0)) },
        { metric: "Expiring in 30 days", value: inr(sum(soon, (p) => stockValue(p) ?? 0)) },
      ],
      text: lines.join("\n"),
      note: "Built from the latest uploaded data. It is a message you copy and send yourself: nothing is sent from here.",
    };
  },
};

export const toolsReports: ReportDef[] = [
  dailySummary,
  reuse("tool-ageing-analysis", "Account ageing analysis (party-wise, top 50)", "out-ageing-by-party"),
  reuse("tool-monthly-balances", "Outstanding by invoice month", "out-by-month"),
];

export async function toolsDashboard(ctx: ReportCtx): Promise<Stat[]> {
  const [s, b] = await Promise.all([stockDashboard(ctx), batchDashboard(ctx)]);
  return [s[0], b[0], b[1]];
}
