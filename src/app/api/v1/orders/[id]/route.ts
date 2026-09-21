import { apiHandler } from "@/lib/apiHandler";
import { assertStoreSession } from "@/lib/retailerPermissions";
import { getOrgScopedDb } from "@/lib/orgScopedDb";

export function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    const session = await assertStoreSession();
    const { id } = await params;
    // storeId in the filter stops one retailer reading another's order by id.
    const order = await getOrgScopedDb(session.orgId).order.findFirst({
      where: { id, storeId: session.storeId },
      include: { items: true },
    });
    if (!order) return { error: "Order not found." };
    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        notes: order.notes,
        createdAt: order.createdAt.toISOString(),
        totalAmount: Number(order.totalAmount),
        items: order.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
          scheme: i.scheme,
        })),
      },
    };
  });
}
