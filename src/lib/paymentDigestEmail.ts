import { resend, FROM_EMAIL } from "@/lib/resend";

export const PAYMENTS_DIGEST_EMAIL = process.env.PAYMENTS_DIGEST_EMAIL ?? "jptraderskop@gmail.com";

export interface PaymentDigestRow {
  partyName: string;
  amount: number;
  invoiceNos: string[];
  utr: string | null;
  verified: boolean;
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Retry-then-throw, same contract as the other notification emails. */
export async function sendPaymentDigestEmail(dateLabel: string, rows: PaymentDigestRow[]): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await attemptSend(dateLabel, rows);
      return;
    } catch (err) {
      lastError = err;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

async function attemptSend(dateLabel: string, rows: PaymentDigestRow[]): Promise<void> {
  if (!resend) throw new Error("RESEND_API_KEY is not configured — payments digest cannot be sent.");

  const total = Math.round(rows.reduce((sum, r) => sum + r.amount, 0) * 100) / 100;
  const cell = "padding:6px 8px;border-bottom:1px solid #e2e8f0;";
  const body = rows
    .map(
      (r) =>
        `<tr>
          <td style="${cell}">${esc(r.partyName)}</td>
          <td style="${cell}text-align:right;white-space:nowrap;">₹${r.amount.toLocaleString("en-IN")}</td>
          <td style="${cell}">${esc(r.invoiceNos.join(", ") || "—")}</td>
          <td style="${cell}">${esc(r.utr ?? "—")}</td>
          <td style="${cell}">${r.verified ? "Verified" : "Reported"}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:720px;">
      <h2 style="margin-bottom:4px;">Payments of date ${dateLabel}</h2>
      <p style="color:#64748b;margin-top:0;">${rows.length} payment${rows.length === 1 ? "" : "s"} · Total ₹${total.toLocaleString("en-IN")}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f1f5f9;text-align:left;">
            <th style="padding:6px 8px;">Party</th>
            <th style="padding:6px 8px;text-align:right;">Amount</th>
            <th style="padding:6px 8px;">Invoice No.</th>
            <th style="padding:6px 8px;">UTR / Ref</th>
            <th style="padding:6px 8px;">Status</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
      <p style="color:#64748b;font-size:12px;margin-top:16px;">
        "Reported" = the retailer marked this as paid in the app. Match against the bank statement, then tick it
        Verified under Admin → Payments.
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: PAYMENTS_DIGEST_EMAIL,
    subject: `Payments of date ${dateLabel}`,
    html,
  });
  if (error) throw new Error(`Resend API error: ${error.name} — ${error.message}`);
}
