import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { storeLabel } from "@/lib/storeLabel";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";

export default async function SalesmanRegularItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>;
}) {
  const { storeId } = await searchParams;
  const session = await getSession();
  const userId = session.userId as string;
  const lang = await getLang();

  const assignments = await db.routeAssignment.findMany({
    where: { userId },
    select: { routeId: true },
  });
  const routeIds = assignments.map((a) => a.routeId);

  const routeStores = await db.routeStore.findMany({
    where: { routeId: { in: routeIds } },
    include: { store: true },
  });
  const myStores = [...new Map(routeStores.map((rs) => [rs.storeId, rs.store])).values()].sort(
    (a, b) => a.name.localeCompare(b.name),
  );

  const topItems = storeId
    ? await db.purchaseHistoryItem.groupBy({
        by: ["itemName", "unit"],
        where: { storeId },
        _sum: { quantity: true, totalValue: true },
        orderBy: { _sum: { totalValue: "desc" } },
        take: 100,
      })
    : [];

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <h1 className="mb-4 text-lg font-bold text-slate-900">
          {t(lang, "regularly_bought_items_heading")}
        </h1>
        <form method="get" className="flex gap-3">
          <Select name="storeId" defaultValue={storeId ?? ""} required>
            <option value="" disabled>
              {t(lang, "choose_a_store")}
            </option>
            {myStores.map((s) => (
              <option key={s.id} value={s.id}>
                {storeLabel(s.name, s.externalCode)}
              </option>
            ))}
          </Select>
          <Button type="submit">{t(lang, "view")}</Button>
        </form>
      </Card>

      {storeId && (
        <Card className="overflow-x-auto">
          <h2 className="mb-1 text-base font-bold text-slate-900">{t(lang, "highest_value_first")}</h2>
          <p className="mb-3 text-xs text-slate-500">{t(lang, "check_before_order")}</p>
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">{t(lang, "item")}</th>
                <th className="py-2 pr-4">{t(lang, "qty")}</th>
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
                    {t(lang, "no_purchase_history")}
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
