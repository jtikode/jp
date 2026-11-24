import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { StatTiles } from "@/components/admin/aiReports/StatTiles";
import { ReportTable } from "@/components/admin/aiReports/ReportTable";
import { ReportDownload } from "@/components/admin/aiReports/ReportDownload";
import { CopyTextButton } from "@/components/admin/aiReports/CopyTextButton";
import { createReportCtx } from "@/lib/aiReports/ctx";
import { categoriesOf, getGroup, getReport } from "@/lib/aiReports/registry";
import { clsx } from "@/lib/clsx";
import type { ReportDef, ReportParams, ReportResult, Stat } from "@/lib/aiReports/types";

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function AiReportGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ group: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireRole(["ADMIN"]);
  const { group: groupId } = await params;
  const sp = await searchParams;

  const group = getGroup(groupId);
  if (!group) notFound();

  const categories = categoriesOf(group.id);
  const selected: ReportDef | undefined = (() => {
    const r = getReport(first(sp.q));
    return r && r.group === group.id ? r : undefined;
  })();
  const values: ReportParams = {};
  for (const p of selected?.params ?? []) values[p.key] = first(sp[p.key]);
  const paramsReady = (selected?.params ?? []).every((p) => values[p.key].trim() !== "");

  const ctx = createReportCtx(session.orgId);
  let stats: Stat[] = [];
  let dashboardError = false;
  try {
    stats = await group.dashboard(ctx);
  } catch (err) {
    console.error(`AI Reports dashboard failed for ${group.id}:`, err);
    dashboardError = true;
  }

  let result: ReportResult | null = null;
  let reportError = false;
  if (selected && paramsReady) {
    try {
      result = await selected.run(ctx, values);
    } catch (err) {
      console.error(`AI Report ${selected.id} failed:`, err);
      reportError = true;
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Card>
        <p className="text-xs font-medium text-slate-500">
          <Link href="/team/admin/ai-reports" className="text-blue-700 hover:underline">
            AI Reports
          </Link>{" "}
          / {group.title}
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">{group.title}</h1>
        <p className="mt-0.5 text-sm text-slate-600">{group.blurb}</p>
        <p className="mt-2 text-xs text-slate-500">Data: {group.source}</p>
      </Card>

      {dashboardError ? (
        <Card>
          <p className="text-sm font-medium text-red-700">The summary could not be loaded. Try again in a moment.</p>
        </Card>
      ) : (
        <Card>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Summary</h2>
          <StatTiles stats={stats} />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <Card className="h-fit space-y-4 lg:sticky lg:top-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Questions</h2>
          {categories.map((c) => (
            <div key={c.name}>
              <p className="mb-1 text-sm font-bold text-slate-900">{c.name}</p>
              <ul className="space-y-0.5">
                {c.reports.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/team/admin/ai-reports/${group.id}?q=${r.id}`}
                      className={clsx(
                        "block rounded-md px-2 py-1.5 text-sm",
                        selected?.id === r.id ? "bg-blue-100 font-semibold text-blue-900" : "text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Card>

        <Card className="min-w-0">
          {!selected ? (
            <p className="py-10 text-center text-sm text-slate-500">Pick a question on the left to see its report.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500">{selected.category}</p>
                <h2 className="text-lg font-bold text-slate-900">{selected.title}</h2>
              </div>

              {selected.params && selected.params.length > 0 && (
                <form method="get" className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="q" value={selected.id} />
                  {selected.params.map((p) => (
                    <label key={p.key} className="text-sm font-medium text-slate-700">
                      {p.label}
                      <input
                        name={p.key}
                        type="text"
                        inputMode={p.type === "number" ? "decimal" : "text"}
                        defaultValue={values[p.key]}
                        placeholder={p.placeholder}
                        className="mt-1 block w-56 rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                        required
                      />
                    </label>
                  ))}
                  <button type="submit" className="min-h-11 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">
                    Show report
                  </button>
                </form>
              )}

              {reportError && <p className="text-sm font-medium text-red-700">This report could not be built. Try again in a moment.</p>}

              {!paramsReady && !reportError && <p className="text-sm text-slate-500">Fill in the box above to see the report.</p>}

              {result && (
                <div className="space-y-4">
                  {result.stats && result.stats.length > 0 && <StatTiles stats={result.stats} />}
                  {result.text && (
                    <div className="space-y-2">
                      <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">{result.text}</pre>
                      <CopyTextButton text={result.text} label="Copy for WhatsApp" />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-slate-600">
                      {result.rows.length.toLocaleString("en-IN")} {result.rows.length === 1 ? "row" : "rows"}
                    </p>
                    <ReportDownload columns={result.columns} rows={result.rows} filename={`${selected.id}-${new Date().toISOString().slice(0, 10)}`} />
                  </div>
                  <ReportTable columns={result.columns} rows={result.rows} />
                  {result.note && <p className="text-xs text-slate-500">{result.note}</p>}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
