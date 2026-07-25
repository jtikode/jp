import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { StockSheetList } from "@/components/warehouse/StockSheetList";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default async function WarehouseStockPage() {
  const [items, todaysCounts] = await Promise.all([
    db.stockItem.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.stockCount.findMany({ where: { date: startOfToday() } }),
  ]);

  const countByItem = new Map(todaysCounts.map((c) => [c.stockItemId, Number(c.quantity)]));

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <h1 className="mb-1 text-lg font-bold text-slate-900">Stock Sheet</h1>
        <p className="mb-4 text-sm text-slate-500">Enter today&apos;s count of stock on shelf.</p>
        <StockSheetList
          items={items.map((i) => ({
            id: i.id,
            name: i.name,
            quantity: countByItem.get(i.id) ?? null,
          }))}
        />
      </Card>
    </div>
  );
}
