import { notFound } from "next/navigation";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t, orderStatusLabel } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { ReorderButton } from "@/components/shop/ReorderButton";

export default async function ShopOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStoreSession();
  const db = getOrgScopedDb(session.orgId);
  const lang = await getLang();
  const { id } = await params;

  // storeId check (not just orgId/id) is what stops one retailer from
  // viewing another retailer's order by guessing/sharing its URL.
  const order = await db.order.findFirst({
    where: { id, storeId: session.storeId },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-900">
            Order — {order.createdAt.toLocaleDateString("en-IN")}
          </h1>
          <span
            className={
              order.status === "PENDING"
                ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
                : order.status === "CANCELLED"
                  ? "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                  : "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
            }
          >
            {orderStatusLabel(lang, order.status)}
          </span>
        </div>
        {order.notes && (
          <p className="mt-2 text-sm italic text-slate-500">
            {t(lang, "shop_note_prefix")} {order.notes}
          </p>
        )}
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">{t(lang, "shop_item")}</th>
              <th className="py-2 pr-4">{t(lang, "shop_qty")}</th>
              <th className="py-2 pr-4">{t(lang, "shop_unit_price")}</th>
              <th className="py-2 pr-4">{t(lang, "shop_line_total")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{i.productName}</td>
                <td className="py-2 pr-4 text-slate-600">{i.quantity}</td>
                <td className="py-2 pr-4 text-slate-600">₹{Number(i.unitPrice).toLocaleString("en-IN")}</td>
                <td className="py-2 pr-4 text-slate-600">₹{Number(i.lineTotal).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <ReorderButton orderId={order.id} lang={lang} />
          <p className="text-lg font-bold text-slate-900">
            {t(lang, "shop_total")}: ₹{Number(order.totalAmount).toLocaleString("en-IN")}
          </p>
        </div>
      </Card>
    </div>
  );
}
