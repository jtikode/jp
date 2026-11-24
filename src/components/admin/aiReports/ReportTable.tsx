import type { Column, Row } from "@/lib/aiReports/types";
import { formatCell, isNumericFormat } from "@/lib/aiReports/format";
import { clsx } from "@/lib/clsx";

export const MAX_ROWS_SHOWN = 500;

export function ReportTable({ columns, rows }: { columns: Column[]; rows: Row[] }) {
  if (columns.length === 0) return null;
  if (rows.length === 0) {
    return <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Nothing to show for this question.</p>;
  }
  const shown = rows.slice(0, MAX_ROWS_SHOWN);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            {columns.map((c) => (
              <th key={c.key} className={clsx("whitespace-nowrap py-2 pr-4 font-medium", isNumericFormat(c.format) && "text-right")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 align-top">
              {columns.map((c) => (
                <td key={c.key} className={clsx("py-2 pr-4", isNumericFormat(c.format) ? "text-right tabular-nums" : "text-slate-800")}>
                  {formatCell(r[c.key], c.format)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > shown.length && (
        <p className="mt-2 text-xs font-medium text-amber-700">
          Showing the first {shown.length.toLocaleString("en-IN")} of {rows.length.toLocaleString("en-IN")} rows. Download the CSV for all of them.
        </p>
      )}
    </div>
  );
}
