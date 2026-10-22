import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { normalizeName } from "@/lib/normalizeName";

export default async function SalesmanNearExpiryPage() {
  const session = await getSession();
  const db = getOrgScopedDb(session.orgId as string);
  const lang = await getLang();
  const [nearExpiryItems, products] = await Promise.all([
    db.expiryItem.findMany({ orderBy: { expiryDate: "asc" }, take: 100 }),
    db.product.findMany({ where: { active: true }, select: { name: true, stock: true } }),
  ]);
  // The expiry list has no quantity of its own: show the item's current stock
  // (all batches together) from the product catalogue.
  const stockByName = new Map<string, number | null>();
  for (const p of products) {
    const key = normalizeName(p.name);
    if (!stockByName.has(key) || (stockByName.get(key) == null && p.stock != null)) stockByName.set(key, p.stock);
  }

  const today = new Date();

  return (
    <div className="mx-auto max-w-md">
      <Card className="overflow-x-auto">
        <h1 className="mb-1 text-lg font-bold text-slate-900">{t(lang, "near_expiry_heading")}</h1>
        <p className="mb-4 text-sm text-slate-500">{t(lang, "soonest_expiry_first")}</p>
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">{t(lang, "item")}</th>
              <th className="py-2 pr-4">{t(lang, "expiry")}</th>
              <th className="py-2 pr-4">{t(lang, "near_expiry_qty")}</th>
              <th className="py-2 pr-4">{t(lang, "rate")}</th>
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
                    {item.expiryDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" })} ({daysLeft}d)
                  </td>
                  <td className="py-2 pr-4 font-semibold text-slate-900">
                    {stockByName.get(normalizeName(item.itemName)) ?? "—"}
                  </td>
                  <td className="py-2 pr-4 text-slate-600">
                    {item.specialRate != null ? `₹${Number(item.specialRate).toLocaleString("en-IN")}` : "—"}
                  </td>
                </tr>
              );
            })}
            {nearExpiryItems.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">
                  {t(lang, "no_expiry_uploaded")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
