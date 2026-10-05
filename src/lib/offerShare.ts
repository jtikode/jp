const APP_OFFERS_URL = "https://app.jpkop.in/shop/offers";

export interface ShareLine {
  name: string;
  quantity: number;
  freeQty: number;
  // Per-unit rate the retailer pays for the paid units (ex-GST).
  unitPrice: number;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// Milliseconds until `date` (negative once it has passed). Kept out of the
// components so they stay free of Date.now() during render.
export function msUntil(date: Date): number {
  return date.getTime() - Date.now();
}

// Fixed to IST so the text reads the same wherever it is generated.
export function formatIstDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(date);
}

export function formatIstDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

// A ready-to-paste WhatsApp message for an offer: what to buy, what comes
// free, until when, and the link into the app.
export function buildOfferShareText(input: { title: string | null; lines: ShareLine[]; endsAt: Date | null }): string {
  const out: string[] = [`🎁 *${input.title ?? "New offer on the JP app"}*`, ""];

  const buy = input.lines
    .filter((l) => l.quantity - l.freeQty > 0)
    .map((l) => `${l.name} × ${l.quantity - l.freeQty}${l.unitPrice > 0 ? ` at ${inr(l.unitPrice)} + GST` : ""}`);
  const free = input.lines.filter((l) => l.freeQty > 0).map((l) => `${l.name} × ${l.freeQty}`);

  if (buy.length > 0) out.push("Buy:", ...buy.map((b) => `• ${b}`), "");
  if (free.length > 0) out.push("Get FREE:", ...free.map((f) => `• ${f}`), "");
  if (input.endsAt) out.push(`Valid till ${formatIstDate(input.endsAt)}`, "");
  out.push(`Order now on the JP app: ${APP_OFFERS_URL}`);
  return out.join("\n");
}
