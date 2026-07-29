import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { storeLabel } from "@/lib/storeLabel";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>;
}) {
  const { storeId } = await searchParams;

  const nearExpiryItems = await db.expiryItem.findMany({
    orderBy: { expiryDate: "asc" },
    take: 100,
  });

  const storesWithHistory = await db.store.findMany({
    where: { purchaseHistory: { some: {} } },
    orderBy: { name: "asc" },
  });

  const topItems = storeId
    ? await db.purchaseHistoryItem.groupBy({
        by: ["itemName", "unit"],
        where: { storeId },
        _sum: { quantity: true, totalValue: true },
        orderBy: { _sum: { totalValue: "desc" } },
        take: 100,
      })
    : [];

  const today = new Date();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="overflow-x-auto">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-slate-900">Near-Expiry Focus List</h1>
          <ExportExcelButton
            data={nearExpiryItems.map((item) => ({
              Item: item.itemName,
              Expiry: item.expiryDate.toLocaleDateString("en-IN"),
              "Special Rate": item.specialRate != null ? Number(item.specialRate) : "",
            }))}
            filename="near-expiry-list"
          />
        </div>
        <p className="mb-4 text-sm text-slate-500">Soonest expiry first — push these at special rate.</p>
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4">Expiry</th>
              <th className="py-2 pr-4">Special Rate</th>
            </tr>
          </thead>
          <tbody>
            {nearExpiryItems.map((item) => {
              const daysLeft = Math.ceil(
                (item.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
              );
              const urgency =
                daysLeft <= 7
                  ? "text-red-700 font-semibold"
                  : daysLeft <= 30
                    ? "text-amber-700 font-semibold"
                    : "text-slate-600";
              return (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-900">{item.itemName}</td>
                  <td className={`py-2 pr-4 ${urgency}`}>
                    {item.expiryDate.toLocaleDateString("en-IN")} ({daysLeft}d)
                  </td>
                  <td className="py-2 pr-4 text-slate-600">
                    {item.specialRate != null ? `₹${Number(item.specialRate).toLocaleString("en-IN")}` : "—"}
                  </td>
                </tr>
              );
            })}
            {nearExpiryItems.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-slate-400">
                  No near-expiry stock uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card>
        <h1 className="mb-4 text-lg font-bold text-slate-900">Past Purchase Intelligence</h1>
        <form method="get" className="flex gap-3">
          <Select name="storeId" defaultValue={storeId ?? ""} required>
            <option value="" disabled>
              Choose a store
            </option>
            {storesWithHistory.map((s) => (
              <option key={s.id} value={s.id}>
                {storeLabel(s.name, s.externalCode)}
              </option>
            ))}
          </Select>
          <Button type="submit">View</Button>
        </form>
      </Card>

      {storeId && (
        <Card className="overflow-x-auto">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Regularly bought items (highest value first)
            </h2>
            <ExportExcelButton
              data={topItems.map((item) => ({
                Item: item.itemName,
                Quantity: Number(item._sum.quantity ?? 0),
                Unit: item.unit ?? "",
                Value: Number(item._sum.totalValue ?? 0),
              }))}
              filename="regular-items"
            />
          </div>
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Quantity</th>
                <th className="py-2 pr-4">Value</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item) => (
                <tr key={`${item.itemName}-${item.unit}`} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-900">{item.itemName}</td>
                  <td className="py-2 pr-4 text-slate-600">
                    {Number(item._sum.quantity ?? 0).toLocaleString("en-IN")} {item.unit ?? ""}
                  </td>
                  <td className="py-2 pr-4 text-slate-600">
                    ₹{Number(item._sum.totalValue ?? 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {topItems.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-400">
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
