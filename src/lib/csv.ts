import Papa from "papaparse";
import * as XLSX from "xlsx";

export type RawRow = Record<string, string>;

/** Parses a CSV or Excel file buffer into an array of header->value row objects. */
export function parseSpreadsheet(fileName: string, buffer: ArrayBuffer): RawRow[] {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".csv")) {
    const text = new TextDecoder().decode(buffer);
    const result = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true });
    return result.data;
  }

  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });
}

/**
 * Finds a value in a row by trying each alias case-insensitively against the
 * row's own headers, since master-data exports may not use exact column names.
 */
export function findColumn(row: RawRow, aliases: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const match = keys.find((k) => k.trim().toLowerCase() === alias.toLowerCase());
    if (match && row[match]?.toString().trim() !== "") {
      return row[match].toString().trim();
    }
  }
  return undefined;
}
