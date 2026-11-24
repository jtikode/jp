import type { GroupDef, GroupId, ReportDef } from "./types";
import { accountDashboard, accountReports } from "./reports/account";
import { outstandingDashboard, outstandingReports } from "./reports/outstanding";
import { salesDashboard, salesReports } from "./reports/sales";
import { stockDashboard, stockReports } from "./reports/stock";
import { batchDashboard, batchReports } from "./reports/batch";
import { toolsDashboard, toolsReports } from "./reports/tools";

export const GROUPS: GroupDef[] = [
  {
    id: "account",
    title: "Account Reports",
    blurb: "Who owes you, how much, and which party records need fixing.",
    source: "The last uploaded outstanding statement and the store master.",
    dashboard: accountDashboard,
  },
  {
    id: "outstanding",
    title: "Outstanding Reports",
    blurb: "Bills by age and due date, whom to call first, and who to watch before giving more credit.",
    source: "The last uploaded outstanding statement (open invoices with invoice and due dates).",
    dashboard: outstandingDashboard,
  },
  {
    id: "sales",
    title: "Item Sales",
    blurb: "Best and slowest items, best parties and how concentrated your sales are.",
    source: "Orders placed through the shop app, plus the uploaded company-sales statement. Not your full billing sales.",
    dashboard: salesDashboard,
  },
  {
    id: "stock",
    title: "Stock Reports",
    blurb: "What you hold, what it is worth, and what has run out or is about to.",
    source: "The last stock upload, valued at purchase rate.",
    dashboard: stockDashboard,
  },
  {
    id: "batch",
    title: "Expiry & Margin Reports",
    blurb: "Stock about to expire or already expired, and which items earn the best or worst margin.",
    source: "The last stock upload (soonest expiry per item) with selling and purchase rates.",
    dashboard: batchDashboard,
  },
  {
    id: "tools",
    title: "Daily Summary & Tools",
    blurb: "A one-message daily summary to paste into WhatsApp, plus party-wise ageing and month-wise outstanding.",
    source: "All of the above.",
    dashboard: toolsDashboard,
  },
];

export const REPORTS: ReportDef[] = [
  ...accountReports,
  ...outstandingReports,
  ...salesReports,
  ...stockReports,
  ...batchReports,
  ...toolsReports,
];

export function getGroup(id: string): GroupDef | undefined {
  return GROUPS.find((g) => g.id === id);
}

export function getReport(id: string | undefined): ReportDef | undefined {
  return id ? REPORTS.find((r) => r.id === id) : undefined;
}

// Categories in the order their first report is declared.
export function categoriesOf(group: GroupId): { name: string; reports: ReportDef[] }[] {
  const out: { name: string; reports: ReportDef[] }[] = [];
  for (const r of REPORTS.filter((x) => x.group === group)) {
    let cat = out.find((c) => c.name === r.category);
    if (!cat) {
      cat = { name: r.category, reports: [] };
      out.push(cat);
    }
    cat.reports.push(r);
  }
  return out;
}
