import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface Option {
  id: string;
  label: string;
}

interface FilterBarProps {
  routes: Option[];
  employees: Option[];
  values: {
    from?: string;
    to?: string;
    routeId?: string;
    employeeId?: string;
    attendanceStatus?: string;
  };
}

const ATTENDANCE_STATUSES = [
  ["LEAVE", "Leave"],
  ["HALF_LEAVE", "Half Leave"],
  ["ABSENT", "Absent"],
  ["HOLIDAY_WEEKOFF", "Holiday / Week Off"],
  ["OFFICE_DAY", "Day at Office"],
];

export function FilterBar({ routes, employees, values }: FilterBarProps) {
  return (
    <form method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
        <input
          type="date"
          name="from"
          defaultValue={values.from}
          className="min-h-11 w-full rounded-lg border-2 border-slate-300 px-3 text-sm text-slate-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
        <input
          type="date"
          name="to"
          defaultValue={values.to}
          className="min-h-11 w-full rounded-lg border-2 border-slate-300 px-3 text-sm text-slate-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Route</label>
        <Select name="routeId" defaultValue={values.routeId ?? ""} className="min-h-11 text-sm">
          <option value="">All routes</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Employee</label>
        <Select name="employeeId" defaultValue={values.employeeId ?? ""} className="min-h-11 text-sm">
          <option value="">All employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Attendance Status</label>
        <Select
          name="attendanceStatus"
          defaultValue={values.attendanceStatus ?? ""}
          className="min-h-11 text-sm"
        >
          <option value="">Any</option>
          {ATTENDANCE_STATUSES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="col-span-full flex gap-2">
        <Button type="submit" className="min-h-11 px-6 py-2 text-sm">
          Apply filters
        </Button>
        <a
          href="/team/admin/dashboard"
          className="flex min-h-11 items-center rounded-xl border-2 border-slate-300 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Clear
        </a>
      </div>
    </form>
  );
}
