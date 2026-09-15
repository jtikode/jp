"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { clsx } from "@/lib/clsx";
import type { EmployeeTrends } from "@/lib/taskReporting";

export function TaskTrendChart({
  trendsByEmployee,
  employees,
}: {
  trendsByEmployee: Record<string, EmployeeTrends>;
  employees: { id: string; name: string }[];
}) {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [employeeId, setEmployeeId] = useState("ALL");

  const data = (trendsByEmployee[employeeId] ?? trendsByEmployee.ALL)[period];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(["weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-semibold capitalize",
                period === p ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800",
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="ALL">Whole team</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={30} />
          <Tooltip />
          <Legend />
          <Bar dataKey="approved" stackId="a" fill="#16a34a" name="Approved" />
          <Bar dataKey="awaiting" stackId="a" fill="#d97706" name="Awaiting approval" />
          <Bar dataKey="missed" stackId="a" fill="#dc2626" name="Missed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
