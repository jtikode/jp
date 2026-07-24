import { clsx } from "@/lib/clsx";

export interface DayCell {
  day: number;
  isToday: boolean;
  totalCalls: number;
  productiveCalls: number;
  status: string | null; // AttendanceStatus, "OFFICIAL_VISIT" (derived), or null
}

const STATUS_STYLES: Record<string, string> = {
  OFFICIAL_VISIT: "bg-green-100 border-green-300 text-green-800",
  LEAVE: "bg-red-100 border-red-300 text-red-800",
  HALF_LEAVE: "bg-orange-100 border-orange-300 text-orange-800",
  ABSENT: "bg-slate-200 border-slate-300 text-slate-600",
  HOLIDAY_WEEKOFF: "bg-purple-100 border-purple-300 text-purple-800",
  OFFICE_DAY: "bg-blue-100 border-blue-300 text-blue-800",
};

const LEGEND: Array<[string, string]> = [
  ["OFFICIAL_VISIT", "Official Visit"],
  ["LEAVE", "Leave"],
  ["HALF_LEAVE", "Half Leave"],
  ["ABSENT", "Absent"],
  ["HOLIDAY_WEEKOFF", "Holiday / Week Off"],
  ["OFFICE_DAY", "Day at Office"],
];

export function DCRCalendarGrid({ cells, leadingBlanks }: { cells: DayCell[]; leadingBlanks: number }) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {cells.map((cell) => (
          <div
            key={cell.day}
            className={clsx(
              "flex min-h-16 flex-col rounded-lg border-2 p-1.5 text-xs",
              cell.status ? STATUS_STYLES[cell.status] : "border-slate-200 bg-white text-slate-400",
              cell.isToday && "ring-2 ring-blue-500",
            )}
          >
            <span className="font-semibold">{cell.day}</span>
            {cell.totalCalls > 0 && (
              <span className="mt-auto leading-tight">
                {cell.totalCalls} calls
                <br />
                {cell.productiveCalls} prod.
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {LEGEND.map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={clsx("h-3 w-3 rounded border", STATUS_STYLES[key])} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
