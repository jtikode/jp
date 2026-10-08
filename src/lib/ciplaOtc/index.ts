import { OTC_SHEET_2026_10 } from "./sheets/2026-10";
import type { OtcSheet } from "./types";

// Each month's PDF becomes one file under ./sheets; add it to this list and
// point CURRENT_OTC_SHEET_ID at it. Older sheets stay so past orders can still
// be read against the rates they were booked at.
export const OTC_SHEETS: OtcSheet[] = [OTC_SHEET_2026_10];

// Orders from the portal go into the normal Orders list, marked by this prefix
// on the order notes, so billing and warehouse work from one list.
export const CIPLA_OTC_NOTE_PREFIX = "CIPLA OTC";

export const CURRENT_OTC_SHEET_ID = "2026-10";

export function getOtcSheet(id: string = CURRENT_OTC_SHEET_ID): OtcSheet {
  return OTC_SHEETS.find((s) => s.id === id) ?? OTC_SHEETS[OTC_SHEETS.length - 1];
}

export const currentOtcSheet = (): OtcSheet => getOtcSheet(CURRENT_OTC_SHEET_ID);

export { evaluateCart, findSku, inr, lineKey, round2 } from "./engine";
export type { CartLine, OtcBrand, OtcPrice, OtcRule, OtcSheet, OtcSku } from "./types";
