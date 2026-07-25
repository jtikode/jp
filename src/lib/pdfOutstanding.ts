import { PDFParse } from "pdf-parse";

export interface OutstandingInvoiceRow {
  code: string;
  invoiceNo: string;
  invoiceDate: Date;
  billAmount: number;
  outstandingAmount: number;
}

const HEADER_RE = /J\s+P\s+TRADERS\s+(\d{3,6})/g;
// Captures invoiceNo, date(dd/mm/yy), bill amount, balance due, and the
// printed running (cumulative) total — the last is used to validate which
// store a row belongs to, since column position alone is unreliable (see
// parseOutstandingPdf doc comment).
const INVOICE_RE =
  /\*?(JP\d+)\s+(\d{2})-(\d{2})-(\d{2})\s+\d+\s+([\d.]+)\s+([\d.]+)\s+\d+\s+([\d.]+)/g;

interface Slot {
  code: string | null;
  runningTotal: number;
}

/**
 * Parses the owner's billing-software "outstanding" ledger export (PDF).
 * It's printed as two side-by-side columns per page, each starting a new
 * store block at a "J P TRADERS <code> <name>" header line and listing
 * that store's unpaid invoices below it until the next header.
 *
 * Column *position* in the extracted text is NOT reliable for figuring out
 * which store a mid-block invoice line belongs to: when one column's store
 * has far fewer invoices than its neighbor, that column goes blank while the
 * other keeps printing — and pdf-parse emits the remaining column's text
 * starting at index 0, indistinguishable by position from genuine left-column
 * content. (Confirmed against a real export: a 9-invoice store's tail rows
 * were mis-attributed to a 2-invoice neighbor when relying on position.)
 *
 * Instead, each invoice line prints a running cumulative total specific to
 * its own store's block. We track each open slot's last known cumulative and
 * assign each invoice to whichever slot's (previous total + this balance)
 * matches the printed running total — the data validates its own placement.
 */
export async function parseOutstandingPdf(data: ArrayBuffer): Promise<OutstandingInvoiceRow[]> {
  const parser = new PDFParse({ data: new Uint8Array(data) });
  const result = await parser.getText();
  await parser.destroy();

  const slots: Slot[] = [
    { code: null, runningTotal: 0 },
    { code: null, runningTotal: 0 },
  ];
  const rows: OutstandingInvoiceRow[] = [];

  for (const line of result.text.split("\n")) {
    const headerMatches = [...line.matchAll(HEADER_RE)];
    if (headerMatches.length > 0) {
      // A store's block can shift column position between header lines (the
      // owner's software re-prints a closing total for one store paired with
      // the next store starting on the other side) — so match a new header
      // to an *existing* slot by code, carrying over its running total,
      // rather than assuming index position is a stable identity.
      const oldSlots = slots.map((s) => ({ ...s }));
      const newSlots: Slot[] = [...slots];
      headerMatches.slice(0, 2).forEach((m, i) => {
        const code = m[1];
        const existingIdx = oldSlots.findIndex((s) => s.code === code);
        newSlots[i] =
          existingIdx !== -1
            ? { code, runningTotal: oldSlots[existingIdx].runningTotal }
            : { code, runningTotal: 0 };
      });
      slots[0] = newSlots[0];
      slots[1] = newSlots[1];
      continue;
    }

    const invoiceMatches = [...line.matchAll(INVOICE_RE)];
    if (invoiceMatches.length === 0) continue;

    const usedSlots = new Set<number>();
    const assignedSlot: Array<number | null> = invoiceMatches.map(() => null);

    invoiceMatches.forEach((m, mi) => {
      const balance = Number(m[6]);
      const printedRunning = Number(m[7]);

      let bestSlot: number | null = null;
      for (let si = 0; si < slots.length; si++) {
        if (usedSlots.has(si) || !slots[si].code) continue;
        if (Math.abs(slots[si].runningTotal + balance - printedRunning) < 0.02) {
          bestSlot = si;
          break;
        }
      }
      // Fallback (shouldn't normally trigger): first unused active slot.
      if (bestSlot === null) {
        for (let si = 0; si < slots.length; si++) {
          if (!usedSlots.has(si) && slots[si].code) {
            bestSlot = si;
            break;
          }
        }
      }

      if (bestSlot !== null) {
        usedSlots.add(bestSlot);
        assignedSlot[mi] = bestSlot;
        slots[bestSlot].runningTotal = printedRunning;
      }
    });

    invoiceMatches.forEach((m, mi) => {
      const slotIdx = assignedSlot[mi];
      const code = slotIdx !== null ? slots[slotIdx].code : null;
      if (!code) return;

      const [, invoiceNo, dd, mm, yy, billAmt, balance] = m;
      rows.push({
        code,
        invoiceNo,
        invoiceDate: new Date(2000 + Number(yy), Number(mm) - 1, Number(dd)),
        billAmount: Number(billAmt),
        outstandingAmount: Number(balance),
      });
    });
  }

  return rows;
}
