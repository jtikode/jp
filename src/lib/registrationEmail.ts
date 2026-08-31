import { resend, NOTIFY_EMAIL, FROM_EMAIL } from "@/lib/resend";

export interface ShopRegistrationDetails {
  medicalName: string;
  ownerName: string;
  whatsappNumber: string;
  email?: string;
  drugLicense20B: string;
  drugLicense21B: string;
  licenseExpiry: string;
  gstNumber?: string;
  panNumber?: string;
  fssaiNumber: string;
}

export async function sendRegistrationEmail(details: ShopRegistrationDetails): Promise<void> {
  if (!resend) return;

  const row = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:4px 8px;color:#64748b;">${label}</td><td style="padding:4px 8px;font-weight:600;">${value}</td></tr>`
      : "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;">
      <h2 style="margin-bottom:12px;">New retailer registration</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tbody>
          ${row("Medical/Shop Name", details.medicalName)}
          ${row("Owner Name", details.ownerName)}
          ${row("WhatsApp Number", details.whatsappNumber)}
          ${row("Email", details.email)}
          ${row("Drug License (20-B)", details.drugLicense20B)}
          ${row("Drug License (21-B)", details.drugLicense21B)}
          ${row("License Expiry", details.licenseExpiry)}
          ${row("GST Number", details.gstNumber)}
          ${row("PAN Number", details.panNumber)}
          ${row("FSSAI License Number", details.fssaiNumber)}
        </tbody>
      </table>
    </div>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: `New retailer registration — ${details.medicalName}`,
    html,
  });
}
