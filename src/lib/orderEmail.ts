import { resend, NOTIFY_EMAIL, FROM_EMAIL } from "@/lib/resend";

export interface OrderEmailLine {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export async function sendOrderNotificationEmail(params: {
  orderId: string;
  storeName: string;
  orderGiverWhatsapp?: string | null;
  totalAmount: number;
  notes?: string;
  lines: OrderEmailLine[];
}): Promise<void> {
  if (!resend) return;

  const rows = params.lines
    .map(
      (l) =>
        `<tr><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;">${l.productName}</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${l.quantity}</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${l.unitPrice.toLocaleString("en-IN")}</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${l.lineTotal.toLocaleString("en-IN")}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;">
      <h2 style="margin-bottom:4px;">New order from ${params.storeName}</h2>
      <p style="color:#64748b;margin-top:0;">Order #${params.orderId.slice(-8).toUpperCase()}</p>
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
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: `New order — ${params.storeName} (₹${params.totalAmount.toLocaleString("en-IN")})`,
    html,
  });
}
