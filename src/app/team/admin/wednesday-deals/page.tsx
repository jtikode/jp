import Link from "next/link";
import { assertRole } from "@/lib/permissions";
import { getActiveCatalog } from "@/lib/productCatalog";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { Card } from "@/components/ui/Card";
import { WednesdayDealForm } from "@/components/admin/WednesdayDealForm";
import { toggleWednesdayDealActive } from "@/actions/wednesdayDealActions";

export const dynamic = "force-dynamic";

export default async function AdminWednesdayDealsPage() {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const [catalog, deals] = await Promise.all([
    getActiveCatalog(session.orgId),
    db.wednesdayDeal.findMany({ include: { product: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/team/admin/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        ← Home
      </Link>

      <Card>
        <h1 className="text-xl font-bold text-slate-900">Wednesday Deals</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pick products to sell at a special price every Wednesday, capped per retailer. A banner
          shows automatically at the top of the retailer app on Wednesdays for whatever&rsquo;s active
          here.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-bold text-slate-900">Add a deal</h2>
        <WednesdayDealForm
          products={catalog.map((p) => ({ id: p.id, name: p.name, company: p.company, price: p.price }))}
        />
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-3 text-base font-bold text-slate-900">All deals</h2>
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Product</th>
              <th className="py-2 pr-4">Normal Price</th>
              <th className="py-2 pr-4">Deal Price</th>
              <th className="py-2 pr-4">Max/Retailer</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{d.product.name}</td>
                <td className="py-2 pr-4 text-slate-600">₹{Number(d.product.price).toLocaleString("en-IN")}</td>
                <td className="py-2 pr-4 font-semibold text-red-700">
                  ₹{Number(d.dealPrice).toLocaleString("en-IN")}
                </td>
                <td className="py-2 pr-4 text-slate-600">{d.maxQtyPerStore}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      d.active
                        ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                        : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500"
                    }
                  >
                    {d.active ? "Active" : "Paused"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <form action={toggleWednesdayDealActive.bind(null, d.id, !d.active)}>
                    <button type="submit" className="text-sm font-semibold text-blue-700 hover:underline">
                      {d.active ? "Pause" : "Resume"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {deals.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-400">
                  No Wednesday deals yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
