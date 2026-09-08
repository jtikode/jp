import { Resend } from "resend";

// Shared client — null when RESEND_API_KEY isn't set, so every caller can
// no-op instead of crashing (a missing/misconfigured key must never block
// the user-facing flow that triggered the email).
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const NOTIFY_EMAIL = process.env.ORDER_NOTIFICATION_EMAIL ?? "app.jptk@gmail.com";
// jpkop.in is verified on Resend (see DNS records added at Hostinger), so
// sending works to any recipient — not just the account owner's own inbox,
// which is all the shared onboarding@resend.dev sandbox address allowed.
export const FROM_EMAIL = process.env.ORDER_NOTIFICATION_FROM ?? "J P Traders <orders@jpkop.in>";
