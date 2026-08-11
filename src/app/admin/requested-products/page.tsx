import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { storeLabel } from "@/lib/storeLabel";
import { toggleRequestedProductReviewed } from "@/actions/requestedProductActions";

export default async function AdminRequestedProductsPage() {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const requests = await db.requestedProduct.findMany({
    include: { store: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="overflow-x-auto">
        <h1 className="mb-4 text-lg font-bold text-slate-900">
          Requested Products ({requests.length})
        </h1>
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Store</th>
              <th className="py-2 pr-4">Product</th>
              <th className="py-2 pr-4">Note</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-slate-600">{r.createdAt.toLocaleDateString("en-IN")}</td>
                <td className="py-2 pr-4 font-medium text-slate-900">
                  {storeLabel(r.store.name, r.store.externalCode)}
                </td>
                <td className="py-2 pr-4 text-slate-600">{r.productName}</td>
                <td className="py-2 pr-4 text-slate-500">{r.note ?? "—"}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      r.reviewed
                        ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                        : "rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800"
                    }
                  >
                    {r.reviewed ? "Reviewed" : "New"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <form action={toggleRequestedProductReviewed.bind(null, r.id, !r.reviewed)}>
                    <button type="submit" className="text-sm font-semibold text-blue-700 hover:underline">
                      {r.reviewed ? "Mark new" : "Mark reviewed"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-400">
                  No product requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
