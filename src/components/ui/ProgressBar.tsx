function formatCurrency(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function ProgressBar({
  label,
  achieved,
  target,
  formatValue = formatCurrency,
}: {
  label: string;
  achieved: number;
  target: number;
  formatValue?: (value: number) => string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  const barColor = pct >= 100 ? "bg-green-600" : pct >= 50 ? "bg-blue-600" : "bg-amber-500";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          {formatValue(achieved)} / {target > 0 ? formatValue(target) : "not set"}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {target > 0 && <p className="mt-1 text-xs font-semibold text-slate-500">{pct}% of target</p>}
    </div>
  );
}
