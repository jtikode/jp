"use client";

import type { Column, Row } from "@/lib/aiReports/types";

function csvField(value: string | number | null): string {
  if (value == null) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Downloads every row of the report (not just the rows shown on screen) as a
// CSV that opens in Excel. The BOM keeps Marathi names readable there.
export function ReportDownload({ columns, rows, filename }: { columns: Column[]; rows: Row[]; filename: string }) {
  function download() {
    const lines = [columns.map((c) => csvField(c.label)).join(",")];
    for (const r of rows) lines.push(columns.map((c) => csvField(r[c.key] ?? null)).join(","));
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={rows.length === 0}
      className="min-h-11 rounded-lg border-2 border-green-600 px-4 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:opacity-40"
    >
      Download CSV
    </button>
  );
}
