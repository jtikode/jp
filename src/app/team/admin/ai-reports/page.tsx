import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { StatTiles } from "@/components/admin/aiReports/StatTiles";
import { createReportCtx } from "@/lib/aiReports/ctx";
import { GROUPS, REPORTS } from "@/lib/aiReports/registry";
import type { Stat } from "@/lib/aiReports/types";

export default async function AiReportsPage() {
  const session = await requireRole(["ADMIN"]);
  const ctx = createReportCtx(session.orgId);

  // One shared context, so each data set is read once for all six cards.
  const dashboards = await Promise.all(
    GROUPS.map((g) =>
      g.dashboard(ctx).then(
        (stats): Stat[] => stats.slice(0, 3),
        (err) => {
          console.error(`AI Reports dashboard failed for ${g.id}:`, err);
          return [] as Stat[];
        },
      ),
    ),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">AI Reports</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Ready-made business questions on outstanding, sales, stock and expiry, answered from the data uploaded to this app. Pick a
          group, pick a question, and download the table as CSV.
        </p>
        <p className="mt-2 text-xs font-medium text-amber-700">
          Everything here comes from the last uploads, not live billing. Each report says which data it uses.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((g, i) => {
          const count = REPORTS.filter((r) => r.group === g.id).length;
          return (
            <Card key={g.id} className="flex flex-col gap-3">
              <div>
                <Link href={`/team/admin/ai-reports/${g.id}`} className="text-lg font-bold text-blue-800 hover:underline">
                  {g.title}
                </Link>
                <p className="mt-0.5 text-sm text-slate-600">{g.blurb}</p>
              </div>
              {dashboards[i].length > 0 && <StatTiles stats={dashboards[i]} />}
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <p className="text-xs text-slate-500">
                  {count} questions. Data: {g.source}
                </p>
                <Link
                  href={`/team/admin/ai-reports/${g.id}`}
                  className="shrink-0 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Open
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
