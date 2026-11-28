import { getIstNow } from "@/lib/istTime";

// Billing closes at 5 PM IST every day. This is for display only: retailers
// can place orders 24x7, the shop just tells them billing is closed.
export const BILLING_CLOSE_HOUR_IST = 17;

export function isBillingClosed(at: Date = new Date()): boolean {
  return getIstNow(at).hour >= BILLING_CLOSE_HOUR_IST;
}
