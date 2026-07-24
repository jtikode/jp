import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>;
}) {
  const { storeId } = await searchParams;

  const storesWithHistory = await db.store.findMany({
    where: { purchaseHistory: { some: {} } },
    orderBy: { name: "asc" },
  });

  const topItems = storeId
    ? await db.purchaseHistoryItem.groupBy({
        by: ["itemName", "unit"],
        where: { storeId },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      })
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <h1 className="mb-4 text-lg font-bold text-slate-900">Past Purchase Intelligence</h1>
        <form method="get" className="flex gap-3">
          <Select name="storeId" defaultValue={storeId ?? ""} required>
            <option value="" disabled>
              Choose a store
            </option>
            {storesWithHistory.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Button type="submit">View</Button>
        </form>
      </Card>

      {storeId && (
        <Card className="overflow-x-auto">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Frequently bought items</h2>
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Estimated Quantity</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item) => (
                <tr key={`${item.itemName}-${item.unit}`} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-900">{item.itemName}</td>
                  <td className="py-2 pr-4 text-slate-600">
                    {Number(item._sum.quantity ?? 0).toLocaleString("en-IN")} {item.unit ?? ""}
                  </td>
                </tr>
              ))}
              {topItems.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-slate-400">
                    No purchase history for this store.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
