"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface EmployeeCompletionPoint {
  name: string;
  approved: number;
  awaiting: number;
  missed: number;
}

export function TaskCompletionChart({ data }: { data: EmployeeCompletionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 48)}>
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} />
        <Tooltip />
        <Legend />
        <Bar dataKey="approved" stackId="a" fill="#16a34a" name="Approved" />
        <Bar dataKey="awaiting" stackId="a" fill="#d97706" name="Awaiting approval" />
        <Bar dataKey="missed" stackId="a" fill="#dc2626" name="Missed" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
