"use client";

export function ExportExcelButton({
  data,
  filename,
  label = "Export to Excel",
}: {
  data: Record<string, unknown>[];
  filename: string;
  label?: string;
}) {
  async function handleExport() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={data.length === 0}
      className="min-h-11 rounded-lg border-2 border-green-600 px-4 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:opacity-40"
    >
      {label}
    </button>
  );
}
