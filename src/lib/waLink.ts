export function buildWhatsAppLink(phone: string, message?: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildTelLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
