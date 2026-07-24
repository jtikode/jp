import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { clsx } from "@/lib/clsx";

export async function WarehouseActionList({ taskType }: { taskType: "INWARD" | "SHELVING" | "FULFILLMENT" }) {
  const actions = await db.warehouseAction.findMany({
    where: { taskType },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: true },
  });

  return (
    <Card className="overflow-x-auto">
      <h2 className="mb-4 text-lg font-bold text-slate-900">Recent</h2>
      <table className="w-full min-w-[500px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Reference</th>
            <th className="py-2 pr-4">Item</th>
            <th className="py-2 pr-4">Qty</th>
            <th className="py-2 pr-4">By</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((a) => (
            <tr key={a.id} className="border-b border-slate-100">
              <td className="py-2 pr-4 text-slate-600">{a.createdAt.toLocaleString()}</td>
              <td className="py-2 pr-4 text-slate-600">{a.referenceNo ?? "—"}</td>
              <td className="py-2 pr-4 text-slate-600">{a.itemDescription ?? "—"}</td>
              <td className="py-2 pr-4 text-slate-600">{a.quantity ?? "—"}</td>
              <td className="py-2 pr-4 text-slate-600">{a.user.name}</td>
              <td className="py-2 pr-4">
                <span
                  className={clsx(
                    "rounded-full px-2 py-1 text-xs font-semibold",
                    a.hasDiscrepancy ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700",
                  )}
                >
                  {a.hasDiscrepancy ? "Discrepancy" : "OK"}
                </span>
              </td>
            </tr>
          ))}
          {actions.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-slate-400">
                No entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
