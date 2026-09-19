import { resend, NOTIFY_EMAIL, FROM_EMAIL } from "@/lib/resend";

// Free text typed by a retailer — must never reach the email as raw HTML.
function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export interface ProductRequestEmailParams {
  storeName: string;
  storeWhatsapp?: string | null;
  productName: string;
  company: string;
  note?: string;
}

/** Same retry-then-throw contract as the order email: a lost request is invisible otherwise. */
export async function sendProductRequestEmail(params: ProductRequestEmailParams): Promise<void> {
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

async function attemptSend(params: ProductRequestEmailParams): Promise<void> {
  if (!resend) throw new Error("RESEND_API_KEY is not configured — product request email cannot be sent.");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;">
      <h2 style="margin-bottom:4px;">Product request from ${esc(params.storeName)}</h2>
      ${params.storeWhatsapp ? `<p style="color:#475569;margin-top:0;"><strong>WhatsApp:</strong> ${esc(params.storeWhatsapp)}</p>` : ""}
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        <tr><td style="padding:6px 8px;background:#f1f5f9;width:110px;"><strong>Product</strong></td><td style="padding:6px 8px;">${esc(params.productName)}</td></tr>
        <tr><td style="padding:6px 8px;background:#f1f5f9;"><strong>Company</strong></td><td style="padding:6px 8px;">${esc(params.company)}</td></tr>
        ${params.note ? `<tr><td style="padding:6px 8px;background:#f1f5f9;"><strong>Note</strong></td><td style="padding:6px 8px;">${esc(params.note)}</td></tr>` : ""}
      </table>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: `Product request — ${params.productName} (${params.company}) — ${params.storeName}`,
    html,
  });
  if (error) throw new Error(`Resend API error: ${error.name} — ${error.message}`);
}
