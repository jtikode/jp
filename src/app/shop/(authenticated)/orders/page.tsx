import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t, orderStatusLabel } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";

export default async function ShopOrdersPage() {
  const session = await requireStoreSession();
  const db = getOrgScopedDb(session.orgId);
  const lang = await getLang();

  // Scoped to this store, not just this org — a retailer must never see
  // another store's orders even within the same business.
  const orders = await db.order.findMany({
    where: { storeId: session.storeId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_my_orders_heading")}</h1>
      </Card>

      <div className="flex flex-col gap-3">
        {orders.map((o) => (
          <Link key={o.id} href={`/shop/orders/${o.id}`}>
            <Card className="hover:bg-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {o.createdAt.toLocaleDateString("en-IN")} — {o.items.length} item
                    {o.items.length === 1 ? "" : "s"}
                  </p>
                  <p className="text-sm text-slate-500">₹{Number(o.totalAmount).toLocaleString("en-IN")}</p>
                </div>
                <span
                  className={
                    o.status === "PENDING"
                      ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
                      : o.status === "CANCELLED"
                        ? "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                        : "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                  }
                >
                  {orderStatusLabel(lang, o.status)}
                </span>
              </div>
            </Card>
          </Link>
        ))}
        {orders.length === 0 && (
          <Card>
            <p className="py-6 text-center text-slate-400">{t(lang, "shop_no_orders_yet")}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
