import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { storeLabel } from "@/lib/storeLabel";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";
import { getStartOfIstDayUtc } from "@/lib/istTime";
import type { OrderStatus } from "@/generated/prisma/client";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"];

export type OrderRange = "today" | "all";

// The retailer orders table, shared by the admin and telecaller order pages.
// Only the admin view marks orders as seen: that clears the admin's unseen
// orders badge, which a telecaller opening the list must not do.
export async function OrdersPanel({
  orgId,
  status,
  range,
  markSeen,
}: {
  orgId: string;
  status?: string;
  range: OrderRange;
  markSeen: boolean;
}) {
  const db = getOrgScopedDb(orgId);

  const orders = await db.order.findMany({
    where: {
      ...(status ? { status: status as OrderStatus } : {}),
      ...(range === "today" ? { createdAt: { gte: getStartOfIstDayUtc() } } : {}),
    },
    include: { store: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Capture which orders were unseen BEFORE marking them seen, so this same
  // render can flag them as new — viewing this list at all is the fail-safe
  // that clears the unseen-orders badge, independent of email deliverability.
  const newOrderIds = new Set(markSeen ? orders.filter((o) => !o.adminSeenAt).map((o) => o.id) : []);
  if (markSeen && newOrderIds.size > 0) {
    await db.order.updateMany({ where: { adminSeenAt: null }, data: { adminSeenAt: new Date() } });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card>
        <form method="get" className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500">Period</label>
            <Select name="range" defaultValue={range}>
              <option value="today">Today</option>
              <option value="all">All time</option>
            </Select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
            <Select name="status" defaultValue={status ?? ""}>
              <option value="">All orders</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="min-h-11 px-6 py-2 text-sm">
            View
          </Button>
        </form>
      </Card>

      <Card className="overflow-x-auto">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-slate-900">
            {range === "today" ? "Today's Retailer Orders" : "Retailer Orders"} ({orders.length})
          </h1>
          <ExportExcelButton
            data={orders.map((o) => ({
              "Order #": o.orderNumber,
              Date: o.createdAt.toLocaleString(),
              Store: storeLabel(o.store.name, o.store.externalCode),
              "Ordered By (WhatsApp)": o.store.orderGiverWhatsapp ?? "",
              Items: o.items.length,
              Total: Number(o.totalAmount),
              Status: o.status,
              Notes: o.notes ?? "",
            }))}
            filename="retailer-orders"
          />
        </div>
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Order #</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Store</th>
              <th className="py-2 pr-4">Ordered By</th>
              <th className="py-2 pr-4">Items</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-slate-100 align-top">
                <td className="py-3 pr-4 font-mono font-semibold text-slate-900">
                  #{o.orderNumber}
                  {newOrderIds.has(o.id) && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 font-sans text-[10px] font-bold uppercase text-red-700">
                      New
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 text-slate-600">{o.createdAt.toLocaleString("en-IN")}</td>
                <td className="py-3 pr-4 font-medium text-slate-900">
                  {storeLabel(o.store.name, o.store.externalCode)}
                </td>
                <td className="py-3 pr-4 text-slate-600">
                  {o.store.orderGiverWhatsapp ?? "—"}
                </td>
                <td className="py-3 pr-4 text-slate-600">
                  {o.items.map((i) => `${i.productName} x${i.quantity}`).join(", ")}
                  {o.notes && <p className="mt-1 text-xs italic text-slate-400">Note: {o.notes}</p>}
                </td>
                <td className="py-3 pr-4 font-semibold text-slate-900">
                  ₹{Number(o.totalAmount).toLocaleString("en-IN")}
                </td>
                <td className="py-3 pr-4">
                  <OrderStatusSelect orderId={o.id} status={o.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  {range === "today" ? "No orders today." : "No orders yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
