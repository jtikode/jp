import type { ReportCtx, ReportDef, ReportResult, Stat } from "../types";
import {
  COLS,
  PartyBalance,
  groupBy,
  matchesText,
  normalizeName,
  partyBalances,
  pct,
  round0,
  sum,
  toNum,
} from "../helpers";

const BALANCE_NOTE =
  "Balance here means outstanding on open bills from the last uploaded statement. Credit balances and advances are not in our data.";

function balanceResult(pbs: PartyBalance[], extra?: Partial<ReportResult>): ReportResult {
  return {
    columns: [COLS.party, COLS.route, COLS.phone, COLS.int("bills", "Open bills"), COLS.inr("outstanding", "Outstanding")],
    rows: pbs.map((p) => ({
      party: p.party.label,
      route: p.party.route,
      phone: p.party.phone,
      bills: p.bills,
      outstanding: round0(p.outstanding),
    })),
    note: BALANCE_NOTE,
    ...extra,
  };
}

const byBalanceDesc = (a: PartyBalance, b: PartyBalance) => b.outstanding - a.outstanding;

function filterReport(
  id: string,
  title: string,
  params: ReportDef["params"],
  pick: (b: number, p: Record<string, number>) => boolean,
): ReportDef {
  return {
    id,
    group: "account",
    category: "Balance Filters & Ranges",
    title,
    params,
    run: async (ctx, raw) => {
      const p: Record<string, number> = {};
      for (const k of (params ?? []).map((x) => x.key)) {
        const n = toNum(raw[k]);
        if (n == null) return { columns: [], rows: [], note: "Enter a valid amount." };
        p[k] = n;
      }
      const pbs = (await partyBalances(ctx)).filter((x) => pick(x.outstanding, p)).sort(byBalanceDesc);
      return balanceResult(pbs, {
        stats: [
          { label: "Parties", value: pbs.length, format: "int" },
          { label: "Total balance", value: round0(sum(pbs, (x) => x.outstanding)), format: "inr" },
        ],
      });
    },
  };
}

function topN(id: string, title: string, n: number | null): ReportDef {
  return {
    id,
    group: "account",
    category: "Rankings & Concentration",
    title,
    params: n == null ? [{ key: "n", label: "How many parties", type: "number", placeholder: "e.g. 25" }] : undefined,
    run: async (ctx, raw) => {
      const count = n ?? toNum(raw.n);
      if (count == null || count < 1) return { columns: [], rows: [], note: "Enter how many parties to show." };
      const all = (await partyBalances(ctx)).sort(byBalanceDesc);
      const top = all.slice(0, Math.floor(count));
      const total = sum(all, (x) => x.outstanding);
      return balanceResult(top, {
        stats: [
          { label: `Top ${top.length} balance`, value: round0(sum(top, (x) => x.outstanding)), format: "inr" },
          { label: "Share of total balance", value: pct(sum(top, (x) => x.outstanding), total), format: "pct" },
        ],
      });
    },
  };
}

export const accountReports: ReportDef[] = [
  // ---- Party Search & Data Quality
  {
    id: "acc-search",
    group: "account",
    category: "Party Search & Data Quality",
    title: "Find a party by name",
    params: [{ key: "name", label: "Party name (part of it)", type: "text", placeholder: "e.g. sai medical" }],
    run: async (ctx, raw) => {
      const [parties, pbs] = await Promise.all([ctx.allParties(), partyBalances(ctx)]);
      const bal = new Map(pbs.map((p) => [p.party.id, p.outstanding]));
      const hits = parties.filter((p) => matchesText(p.name, raw.name ?? "")).slice(0, 200);
      return {
        columns: [COLS.party, COLS.route, COLS.phone, COLS.address, COLS.inr("outstanding", "Outstanding")],
        rows: hits.map((p) => ({ party: p.label, route: p.route, phone: p.phone, address: p.address, outstanding: round0(bal.get(p.id) ?? 0) })),
        note: hits.length === 200 ? "Showing the first 200 matches. Type more of the name to narrow it down." : undefined,
      };
    },
  },
  {
    id: "acc-dup-names",
    group: "account",
    category: "Party Search & Data Quality",
    title: "Show duplicate party names",
    run: async (ctx) => {
      const groups = [...groupBy(await ctx.allParties(), (p) => normalizeName(p.name)).values()].filter((g) => g.length > 1);
      groups.sort((a, b) => b.length - a.length || a[0].name.localeCompare(b[0].name));
      return {
        columns: [COLS.text("name", "Name"), COLS.int("count", "Times listed"), COLS.text("codes", "Codes"), COLS.text("routes", "Routes")],
        rows: groups.map((g) => ({
          name: g[0].name,
          count: g.length,
          codes: g.map((p) => p.code || "-").join(", "),
          routes: [...new Set(g.map((p) => p.route || "-"))].join(", "),
        })),
        stats: [{ label: "Names listed more than once", value: groups.length, format: "int" }],
        note: "A repeat is not always a mistake: the same name can be two branches. Check the codes.",
      };
    },
  },
  {
    id: "acc-dup-balance",
    group: "account",
    category: "Party Search & Data Quality",
    title: "Show duplicate parties with total balance",
    run: async (ctx) => {
      const [parties, pbs] = await Promise.all([ctx.allParties(), partyBalances(ctx)]);
      const bal = new Map(pbs.map((p) => [p.party.id, p.outstanding]));
      const groups = [...groupBy(parties, (p) => normalizeName(p.name)).values()].filter((g) => g.length > 1);
      const rows = groups
        .map((g) => ({
          name: g[0].name,
          count: g.length,
          codes: g.map((p) => p.code || "-").join(", "),
          outstanding: round0(sum(g, (p) => bal.get(p.id) ?? 0)),
        }))
        .filter((r) => r.outstanding !== 0)
        .sort((a, b) => b.outstanding - a.outstanding);
      return {
        columns: [COLS.text("name", "Name"), COLS.int("count", "Times listed"), COLS.text("codes", "Codes"), COLS.inr("outstanding", "Total balance")],
        rows,
        note: BALANCE_NOTE,
      };
    },
  },
  {
    id: "acc-no-phone",
    group: "account",
    category: "Party Search & Data Quality",
    title: "Show parties with a balance but no phone number",
    run: async (ctx) => {
      const pbs = (await partyBalances(ctx)).filter((p) => !p.party.phone.trim()).sort(byBalanceDesc);
      return balanceResult(pbs, { stats: [{ label: "Parties without phone", value: pbs.length, format: "int" }] });
    },
  },

  // ---- Balance Filters & Ranges
  filterReport("acc-above", "Show parties with balance above ?", [{ key: "min", label: "Above (Rs)", type: "number" }], (b, p) => b > p.min),
  filterReport("acc-below", "Show parties with balance below ?", [{ key: "max", label: "Below (Rs)", type: "number" }], (b, p) => b < p.max),
  filterReport(
    "acc-between",
    "Show parties with balance between ? and ??",
    [
      { key: "min", label: "From (Rs)", type: "number" },
      { key: "max", label: "To (Rs)", type: "number" },
    ],
    (b, p) => b >= p.min && b <= p.max,
  ),
  filterReport("acc-above-1l", "Show parties with balance above 1 lakh", [], (b) => b > 100000),
  filterReport("acc-above-5l", "Show parties with balance above 5 lakh", [], (b) => b > 500000),
  filterReport("acc-above-10l", "Show parties with balance above 10 lakh", [], (b) => b > 1000000),
  filterReport("acc-below-10k", "Show parties with balance below 10,000", [], (b) => b < 10000),

  // ---- Rankings & Concentration
  topN("acc-top10", "Show top 10 parties by balance", 10),
  topN("acc-top20", "Show top 20 parties by balance", 20),
  topN("acc-top50", "Show top 50 parties by balance", 50),
  topN("acc-top-n", "Show top ? parties by balance", null),
  {
    id: "acc-top10-share",
    group: "account",
    category: "Rankings & Concentration",
    title: "What percentage of total balance sits in the top 10 parties?",
    run: async (ctx) => {
      const all = (await partyBalances(ctx)).sort(byBalanceDesc);
      const total = sum(all, (x) => x.outstanding);
      const top = all.slice(0, 10);
      let running = 0;
      return {
        columns: [COLS.int("rank", "Rank"), COLS.party, COLS.inr("outstanding", "Outstanding"), COLS.pct("share", "Share of total"), COLS.pct("cumulative", "Running share")],
        rows: top.map((p, i) => {
          running += p.outstanding;
          return { rank: i + 1, party: p.party.label, outstanding: round0(p.outstanding), share: pct(p.outstanding, total), cumulative: pct(running, total) };
        }),
        stats: [
          { label: "Top 10 hold", value: pct(sum(top, (x) => x.outstanding), total), format: "pct", hint: `of ${round0(total).toLocaleString("en-IN")} total` },
        ],
        note: BALANCE_NOTE,
      };
    },
  },

  // ---- Summary & Reports
  {
    id: "acc-total",
    group: "account",
    category: "Summary & Reports",
    title: "Show total, positive and negative balance",
    run: async (ctx) => {
      const pbs = await partyBalances(ctx);
      const pos = pbs.filter((p) => p.outstanding > 0);
      const neg = pbs.filter((p) => p.outstanding < 0);
      return {
        columns: [COLS.text("metric", "Measure"), COLS.inr("amount", "Amount"), COLS.int("parties", "Parties")],
        rows: [
          { metric: "Total balance", amount: round0(sum(pbs, (p) => p.outstanding)), parties: pbs.length },
          { metric: "Positive balance (owed to us)", amount: round0(sum(pos, (p) => p.outstanding)), parties: pos.length },
          { metric: "Negative balance (credit)", amount: round0(sum(neg, (p) => p.outstanding)), parties: neg.length },
        ],
        note: BALANCE_NOTE,
      };
    },
  },
  {
    id: "acc-average",
    group: "account",
    category: "Summary & Reports",
    title: "Show average party balance",
    run: async (ctx) => {
      const pbs = (await partyBalances(ctx)).filter((p) => p.outstanding > 0);
      const total = sum(pbs, (p) => p.outstanding);
      const sorted = pbs.map((p) => p.outstanding).sort((a, b) => a - b);
      const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
      return {
        columns: [COLS.text("metric", "Measure"), COLS.inr("amount", "Amount")],
        rows: [
          { metric: "Average balance per party", amount: round0(pbs.length ? total / pbs.length : 0) },
          { metric: "Median balance per party", amount: round0(median) },
          { metric: "Largest balance", amount: round0(sorted[sorted.length - 1] ?? 0) },
          { metric: "Smallest positive balance", amount: round0(sorted[0] ?? 0) },
        ],
        note: BALANCE_NOTE,
      };
    },
  },
  {
    id: "acc-summary",
    group: "account",
    category: "Summary & Reports",
    title: "Complete outstanding summary",
    run: async (ctx) => {
      const [pbs, parties, ledger] = await Promise.all([partyBalances(ctx), ctx.allParties(), ctx.ledger()]);
      const total = sum(pbs, (p) => p.outstanding);
      return {
        columns: [COLS.text("metric", "Measure"), COLS.text("value", "Value")],
        rows: [
          { metric: "Parties in the master list", value: parties.length.toLocaleString("en-IN") },
          { metric: "Parties with open bills", value: pbs.length.toLocaleString("en-IN") },
          { metric: "Open bills", value: ledger.length.toLocaleString("en-IN") },
          { metric: "Total outstanding", value: `Rs ${round0(total).toLocaleString("en-IN")}` },
          { metric: "Average per party", value: `Rs ${round0(pbs.length ? total / pbs.length : 0).toLocaleString("en-IN")}` },
          { metric: "Parties above 1 lakh", value: pbs.filter((p) => p.outstanding > 100000).length.toLocaleString("en-IN") },
          { metric: "Parties below 10,000", value: pbs.filter((p) => p.outstanding < 10000).length.toLocaleString("en-IN") },
        ],
        note: BALANCE_NOTE,
      };
    },
  },
];

export async function accountDashboard(ctx: ReportCtx): Promise<Stat[]> {
  const [pbs, parties] = await Promise.all([partyBalances(ctx), ctx.allParties()]);
  const sorted = [...pbs].sort(byBalanceDesc);
  const total = sum(pbs, (p) => p.outstanding);
  const dupes = [...groupBy(parties, (p) => normalizeName(p.name)).values()].filter((g) => g.length > 1).length;
  return [
    { label: "Total outstanding", value: round0(total), format: "inr" },
    { label: "Parties with dues", value: pbs.length, format: "int", hint: `of ${parties.length.toLocaleString("en-IN")} parties` },
    { label: "Average per party", value: round0(pbs.length ? total / pbs.length : 0), format: "inr" },
    { label: "Top 10 share", value: pct(sum(sorted.slice(0, 10), (p) => p.outstanding), total), format: "pct", tone: "warn" },
    { label: "Duplicate names", value: dupes, format: "int", tone: dupes > 0 ? "warn" : "good" },
  ];
}
