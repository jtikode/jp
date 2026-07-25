export interface SalesmanGlanceRow {
  userId: string;
  name: string;
  todayOrderAmount: number;
  todayCollection: number;
  monthOrderAmount: number;
  monthCollection: number;
  todayTarget: number;
  monthlyTarget: number;
}

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function pctLabel(achieved: number, target: number): string {
  if (target <= 0) return "—";
  return `${Math.round((achieved / target) * 100)}%`;
}

export function SalesmanGlanceTable({ rows }: { rows: SalesmanGlanceRow[] }) {
  return (
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4">Salesman</th>
          <th className="py-2 pr-4">Today Order</th>
          <th className="py-2 pr-4">Today Target %</th>
          <th className="py-2 pr-4">Today Collected</th>
          <th className="py-2 pr-4">Month Order</th>
          <th className="py-2 pr-4">Month Target %</th>
          <th className="py-2 pr-4">Month Collected</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.userId} className="border-b border-slate-100">
            <td className="py-2 pr-4 font-medium text-slate-900">{row.name}</td>
            <td className="py-2 pr-4 text-slate-600">{formatCurrency(row.todayOrderAmount)}</td>
            <td className="py-2 pr-4 text-slate-600">
              {pctLabel(row.todayOrderAmount, row.todayTarget)}
            </td>
            <td className="py-2 pr-4 text-slate-600">{formatCurrency(row.todayCollection)}</td>
            <td className="py-2 pr-4 text-slate-600">{formatCurrency(row.monthOrderAmount)}</td>
            <td className="py-2 pr-4 text-slate-600">
              {pctLabel(row.monthOrderAmount, row.monthlyTarget)}
            </td>
            <td className="py-2 pr-4 text-slate-600">{formatCurrency(row.monthCollection)}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={7} className="py-4 text-center text-slate-400">
              No active salesmen yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
