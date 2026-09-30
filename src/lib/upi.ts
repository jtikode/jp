export function buildUpiLink(params: {
  vpa: string;
  payeeName: string;
  amount?: number;
  note?: string;
}): string {
  const query = [`pa=${encodeURIComponent(params.vpa)}`, `pn=${encodeURIComponent(params.payeeName)}`];
  // Merchant Category Code — required by the NPCI spec, and its absence is a
  // known cause of "Receiver's UPI ID or VPA is not available" specifically
  // on Intent-initiated payments (tapping "Pay Now") while the identical
  // string succeeds when scanned as a QR code: some banks' UPI switches
  // classify an Intent-flow payment with no mc as unclassifiable and reject
  // it, whereas a QR scan is handled by the paying app's own P2P flow that
  // doesn't need it. "0000" is the standard fallback for an uncategorized
  // merchant when the real MCC isn't known.
  query.push("mc=0000");
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
