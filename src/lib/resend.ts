import { Resend } from "resend";

// Shared client — null when RESEND_API_KEY isn't set, so every caller can
// no-op instead of crashing (a missing/misconfigured key must never block
// the user-facing flow that triggered the email).
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const NOTIFY_EMAIL = process.env.ORDER_NOTIFICATION_EMAIL ?? "app.jptk@gmail.com";
// Resend's shared sending domain works with no DNS setup — swap this for an
// address on your own verified domain (e.g. orders@jpkop.in) once you've
// added and verified jpkop.in in the Resend dashboard for better deliverability.
export const FROM_EMAIL = process.env.ORDER_NOTIFICATION_FROM ?? "J P Traders <onboarding@resend.dev>";
