import { getIstNow } from "@/lib/istTime";

// Orders close at 5 PM IST every day and reopen at midnight, so the evening's
// outstation dispatch list is fixed once the warehouse starts packing.
export const ORDER_CUTOFF_HOUR_IST = 17;

export function isOrderingClosed(at: Date = new Date()): boolean {
  return getIstNow(at).hour >= ORDER_CUTOFF_HOUR_IST;
}

// Returned by placeOrder when it refuses an order after the cutoff. Plain
// text in both languages because the same action also serves the native
// apps, which show the error string as-is and have no language cookie.
export const ORDERS_CLOSED_MESSAGE =
  "Orders are closed now (after 5 PM). Please order again tomorrow. / ऑर्डर आता बंद आहेत (संध्याकाळी ५ नंतर). कृपया उद्या पुन्हा ऑर्डर द्या.";
