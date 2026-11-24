import type { Cell, CellFormat } from "./types";

export function formatCell(value: Cell | undefined, format: CellFormat | undefined): string {
  if (value == null || value === "") return "-";
  if (typeof value === "string") return value;
  switch (format) {
    case "inr":
      return `₹${Math.round(value).toLocaleString("en-IN")}`;
    case "int":
      return Math.round(value).toLocaleString("en-IN");
    case "pct":
      return `${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`;
    case "decimal":
      return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    default:
      return String(value);
  }
}

export const isNumericFormat = (f: CellFormat | undefined) => f === "inr" || f === "int" || f === "pct" || f === "decimal";
