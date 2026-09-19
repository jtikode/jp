export function buildUpiLink(params: {
  vpa: string;
  payeeName: string;
  amount?: number;
  note?: string;
}): string {
  const query = [`pa=${encodeURIComponent(params.vpa)}`, `pn=${encodeURIComponent(params.payeeName)}`];
  if (params.amount != null && params.amount > 0) query.push(`am=${params.amount.toFixed(2)}`);
  query.push("cu=INR");
  if (params.note) query.push(`tn=${encodeURIComponent(params.note)}`);
  return `upi://pay?${query.join("&")}`;
}

// Shown in the payer's bank statement and on our side's UPI notification, so
// the invoice numbers let payments be matched to bills without guesswork.
// UPI apps truncate long notes, so fall back to a count once it won't fit.
export function invoiceNote(invoiceNos: Array<string | null>): string | undefined {
  const nos = invoiceNos.filter((n): n is string => !!n);
  if (nos.length === 0) return undefined;
  const joined = `Inv ${nos.join(", ")}`;
  return joined.length <= 50 ? joined : `${nos.length} invoices`;
}
