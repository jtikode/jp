import type { Stat } from "@/lib/aiReports/types";
import { formatCell } from "@/lib/aiReports/format";
import { clsx } from "@/lib/clsx";

const TONE: Record<NonNullable<Stat["tone"]>, string> = {
  good: "text-green-700",
  warn: "text-amber-700",
  bad: "text-red-700",
};

export function StatTiles({ stats, compact = false }: { stats: Stat[]; compact?: boolean }) {
  return (
    <div className={clsx("grid gap-3", compact ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-5")}>
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-medium text-slate-500">{s.label}</p>
          <p className={clsx("mt-0.5 text-xl font-bold tabular-nums", s.tone ? TONE[s.tone] : "text-slate-900")}>
            {typeof s.value === "number" ? formatCell(s.value, s.format) : s.value}
          </p>
          {s.hint && <p className="text-[11px] text-slate-500">{s.hint}</p>}
        </div>
      ))}
    </div>
  );
}
