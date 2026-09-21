import { apiHandler } from "@/lib/apiHandler";
import { assertStoreSession } from "@/lib/retailerPermissions";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { placeOrder, type CartLine } from "@/actions/orderActions";

export function GET() {
  return apiHandler(async () => {
    const session = await assertStoreSession();
    const orders = await getOrgScopedDb(session.orgId).order.findMany({
      where: { storeId: session.storeId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return {
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        itemCount: o.items.length,
        totalAmount: Number(o.totalAmount),
      })),
    };
  });
}

export function POST(request: Request) {
  return apiHandler(async () => {
    const body = (await request.json().catch(() => null)) as {
      lines?: CartLine[];
      notes?: string;
      clientRequestId?: string;
    } | null;
    if (!body || !Array.isArray(body.lines)) return { ok: false, error: "Your cart is empty." };
    // placeOrder is idempotent on clientRequestId, so the app can safely retry.
    return placeOrder(body.lines, body.notes, body.clientRequestId);
  });
}
