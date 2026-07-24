"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface MonthlyPoint {
  month: string;
  visits: number;
  collection: number;
}

export function RouteBarChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="visits" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="Visits" />
      </BarChart>
    </ResponsiveContainer>
  );
}
