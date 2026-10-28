import { sendGAEvent } from "@next/third-parties/google";

// Google Analytics events for the retailer app, using GA4's standard event
// names (sign_up, login, add_to_cart, purchase, generate_lead) so Google Ads
// can use them as conversions. Only fires in the browser, and only when the
// GA tag is installed (NEXT_PUBLIC_GA_MEASUREMENT_ID); never throws, so
// tracking can't break ordering.
export function track(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  try {
    sendGAEvent("event", event, params);
  } catch {
    // Analytics blocked or not loaded — ignore.
  }
}
