import { apiHandler } from "@/lib/apiHandler";
import { getOneTapReorderData, getReorderLines } from "@/actions/orderActions";

// GET /api/v1/reorder            one-tap reorder card (last order or frequent items)
// GET /api/v1/reorder?orderId=X  re-priced lines for a specific past order
export function GET(request: Request) {
  return apiHandler(() => {
    const orderId = new URL(request.url).searchParams.get("orderId");
    return orderId ? getReorderLines(orderId) : getOneTapReorderData();
  });
}
