export function buildWhatsAppLink(phone: string, message?: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildTelLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function buildVisitReminderMessage(): string {
  return "नमस्कार, जे.पी. ट्रेडर्सचे प्रतिनिधी उद्या आपल्या दुकानी भेट देणार आहेत. आजच WhatsApp किंवा App वर ऑर्डर नोंदवा.\n\nSent via JP AI";
}

/** Lists a store's regularly bought items and asks if they need any, for the telecaller's WhatsApp button. */
export function buildRegularItemsMessage(itemNames: string[]): string {
  const list = itemNames.map((name, i) => `${i + 1}. ${name}`).join("\n");
  return `नमस्कार, जे.पी. ट्रेडर्सकडून. आपण नियमित खरेदी करता ती उत्पादने:\n\n${list}\n\nयापैकी काही हवे आहे का? कृपया कळवा.\n\nSent via JP AI`;
}
