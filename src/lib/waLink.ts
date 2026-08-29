export function buildWhatsAppLink(phone: string, message?: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildTelLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function buildVisitReminderMessage(): string {
  return "नमस्कार, जे.पी. ट्रेडर्सचे प्रतिनिधी उद्या आपल्या दुकानी भेट देणार आहेत. आजच WhatsApp किंवा App वर ऑर्डर नोंदवा.\n\nSent via MedPoint AI";
}

/** Lists a store's regularly bought items and asks if they need any, for the telecaller's WhatsApp button. */
export function buildRegularItemsMessage(itemNames: string[]): string {
  const list = itemNames.map((name, i) => `${i + 1}. ${name}`).join("\n");
  return `नमस्कार, जे.पी. ट्रेडर्सकडून. आपण नियमित खरेदी करता ती उत्पादने:\n\n${list}\n\nयापैकी काही हवे आहे का? कृपया कळवा.\n\nSent via MedPoint AI`;
}

export interface StatementLine {
  invoiceNo: string | null;
  invoiceDate: Date | null;
  amount: number;
  outstandingAmount: number;
}

/** Formats a store's outstanding ledger as a plain-text statement for the telecaller's "Share on WhatsApp" button. */
export function buildStatementMessage(storeName: string, entries: StatementLine[]): string {
  const total = entries.reduce((sum, e) => sum + e.outstandingAmount, 0);
  const lines = entries.map((e) => {
    const date = e.invoiceDate ? e.invoiceDate.toLocaleDateString("en-IN") : "-";
    return `${e.invoiceNo ?? "-"} (${date}): Rs ${e.outstandingAmount.toLocaleString("en-IN")} due`;
  });

  return [
    `नमस्कार, जे.पी. ट्रेडर्सकडून.`,
    `${storeName} — Outstanding Statement`,
    "",
    ...lines,
    "",
    `Total Outstanding: Rs ${total.toLocaleString("en-IN")}`,
    "",
    "कृपया लवकरात लवकर पेमेंट करावे.",
    "",
    "Sent via MedPoint AI",
  ].join("\n");
}
