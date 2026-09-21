import { apiHandler } from "@/lib/apiHandler";
import { getFastOrderItems } from "@/actions/orderActions";

export function GET() {
  return apiHandler(async () => ({ items: await getFastOrderItems() }));
}
