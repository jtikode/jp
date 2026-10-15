import { resend, NOTIFY_EMAIL, FROM_EMAIL } from "@/lib/resend";

export interface OrderEmailLine {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  scheme?: string;
  // True when this line carries the Gold Member special rate.
  gold?: boolean;
}

/**
 * Sends the new-order email, retrying twice more (three attempts total,
 * short backoff) before giving up — a transient network blip or Resend
 * hiccup shouldn't cost an admin the only notification of a real order.
 * Always throws on final failure (including "not configured" — a missing
 * API key used to make this silently no-op, which is exactly the kind of
 * invisible failure that let orders go unnoticed) so the caller's tracking
 * of emailSentAt always reflects what actually happened.
 */
export async function sendOrderNotificationEmail(params: {
  orderNumber: number;
  storeName: string;
  // MARG party code and store address — several retailers can share a very
  // similar name, so billing needs these to tell them apart at a glance
  // instead of opening the order to check.
  storeCode?: string | null;
  storeAddress?: string | null;
  orderGiverWhatsapp?: string | null;
  totalAmount: number;
  notes?: string;
  // Set when the ordering shop is a Gold Member (special-rate shop).
  goldPercent?: number | null;
  lines: OrderEmailLine[];
  // Count of this store's orders today, including this one — lets billing
  // spot a repeat order from the same store the same day (a common sign the
  // orders should be combined on one invoice) without cross-checking manually.
  ordersTodayCount?: number;
}): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await attemptSend(params);
      return;
    } catch (err) {
      lastError = err;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

async function attemptSend(params: {
  orderNumber: number;
  storeName: string;
  storeCode?: string | null;
  storeAddress?: string | null;
  orderGiverWhatsapp?: string | null;
  totalAmount: number;
  notes?: string;
  // Set when the ordering shop is a Gold Member (special-rate shop).
  goldPercent?: number | null;
  lines: OrderEmailLine[];
  ordersTodayCount?: number;
}): Promise<void> {
  if (!resend) throw new Error("RESEND_API_KEY is not configured — order notification email cannot be sent.");

  const isRepeatOrderToday = (params.ordersTodayCount ?? 1) > 1;
  const repeatBanner = isRepeatOrderToday
    ? `<p style="background:#fef3c7;color:#92400e;border:1px solid #fcd34d;border-radius:6px;padding:8px 12px;font-weight:bold;margin:0 0 12px;">
        ⚠️ This is order #${params.ordersTodayCount} from ${params.storeName} today. Check with billing before invoicing separately.
      </p>`
    : "";

  const rows = params.lines
    .map(
      (l) =>
        `<tr${l.gold ? ' style="background:#fde047;"' : ""}><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;">${l.gold ? `<span style="background:#78350f;color:#fef08a;font-size:11px;font-weight:bold;border-radius:4px;padding:1px 5px;">&#9733; GOLD RATE</span> ` : ""}${l.productName}${l.scheme ? `<br/><span style="color:#b45309;font-size:12px;font-weight:bold;">Scheme: ${l.scheme}</span>` : ""}</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${l.quantity}</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${l.unitPrice.toLocaleString("en-IN")}</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${l.lineTotal.toLocaleString("en-IN")}</td></tr>`,
    )
    .join("");

  const isGold = params.goldPercent != null;
  const goldLineCount = params.lines.filter((l) => l.gold).length;
  const goldBanner = isGold
    ? `<div style="background:#78350f;color:#fef08a;border-radius:8px;padding:10px 14px;margin:0 0 12px;">
        <div style="font-size:18px;font-weight:bold;">&#9733; GOLD MEMBER ORDER &#9733;</div>
        <div style="font-size:14px;margin-top:4px;">${
          goldLineCount > 0
            ? `${goldLineCount} item${goldLineCount === 1 ? "" : "s"} marked GOLD RATE below. <strong>Change the rate in billing to the Rate shown</strong> for those items, not the normal list rate.`
            : "Gold Member shop, but no item on this order carries the gold rate. Bill at the rates shown."
        }</div>
      </div>`
    : "";

  const html = `
    <div style="${isGold ? "background:#fcd34d;padding:14px;border-radius:10px;" : ""}">
    <div style="font-family:Arial,sans-serif;max-width:480px;${isGold ? "background:#fef3c7;border:2px solid #d97706;border-radius:8px;padding:12px;" : ""}">
      ${goldBanner}
      <h2 style="margin-bottom:4px;">New order from ${params.storeName}${params.storeCode ? ` (${params.storeCode})` : ""}</h2>
      <p style="color:#64748b;margin-top:0;">Order #${params.orderNumber}</p>
      ${repeatBanner}
      ${params.storeAddress ? `<p style="color:#475569;"><strong>Address:</strong> ${params.storeAddress}</p>` : ""}
      ${params.orderGiverWhatsapp ? `<p style="color:#475569;"><strong>Ordered by (WhatsApp):</strong> ${params.orderGiverWhatsapp}</p>` : ""}
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f1f5f9;text-align:left;">
            <th style="padding:4px 8px;">Item</th>
            <th style="padding:4px 8px;text-align:right;">Qty</th>
            <th style="padding:4px 8px;text-align:right;">Rate</th>
            <th style="padding:4px 8px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="font-size:16px;font-weight:bold;margin-top:12px;">
        Total: ₹${params.totalAmount.toLocaleString("en-IN")}
      </p>
      ${params.notes ? `<p style="color:#475569;"><strong>Notes:</strong> ${params.notes}</p>` : ""}
    </div>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: `${isGold ? "[GOLD] " : ""}${isRepeatOrderToday ? `[Order #${params.ordersTodayCount} today] ` : ""}New order #${params.orderNumber}: ${params.storeName}${params.storeCode ? ` (${params.storeCode})` : ""} (₹${params.totalAmount.toLocaleString("en-IN")})`,
    html,
  });
  // The Resend SDK resolves (never rejects) on an API-level failure like a
  // sandboxed account or unverified domain — without this throw, a caller's
  // try/catch around this call would never fire and the failure would be
  // invisible.
  if (error) throw new Error(`Resend API error: ${error.name} — ${error.message}`);
}
