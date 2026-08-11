import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { AddProductForm } from "@/components/admin/AddProductForm";
import { FileImportForm } from "@/components/admin/FileImportForm";
import { importProducts, toggleProductActive } from "@/actions/productActions";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";

export default async function AdminProductsPage() {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const products = await db.product.findMany({
    orderBy: [{ company: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Add a single product</h2>
        <AddProductForm />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Upload product list</h2>
        <p className="mb-4 text-sm text-slate-500">
          Excel/CSV with item name, price, and optional company/unit columns. Re-uploading updates
          existing products by name (including price) rather than duplicating them.
        </p>
        <FileImportForm action={importProducts} buttonLabel="Upload product list" itemLabel="products" />
      </Card>

      <Card className="overflow-x-auto">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Catalog ({products.length})</h2>
          <ExportExcelButton
            data={products.map((p) => ({
              Company: p.company ?? "",
              Product: p.name,
              Unit: p.unit ?? "",
              Price: Number(p.price),
              MRP: p.mrp != null ? Number(p.mrp) : "",
              "Tax %": p.taxPercent != null ? Number(p.taxPercent) : "",
              Scheme: p.scheme ?? "",
              Status: p.active ? "Active" : "Hidden",
            }))}
            filename="products"
          />
        </div>
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Company</th>
              <th className="py-2 pr-4">Product</th>
              <th className="py-2 pr-4">Unit</th>
              <th className="py-2 pr-4">Price</th>
              <th className="py-2 pr-4">M.R.P</th>
              <th className="py-2 pr-4">Tax %</th>
              <th className="py-2 pr-4">Scheme</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-slate-600">{p.company ?? "—"}</td>
                <td className="py-2 pr-4 font-medium text-slate-900">{p.name}</td>
                <td className="py-2 pr-4 text-slate-600">{p.unit ?? "—"}</td>
                <td className="py-2 pr-4 text-slate-600">₹{Number(p.price).toLocaleString("en-IN")}</td>
                <td className="py-2 pr-4 text-slate-600">
                  {p.mrp != null ? `₹${Number(p.mrp).toLocaleString("en-IN")}` : "—"}
                </td>
                <td className="py-2 pr-4 text-slate-600">
                  {p.taxPercent != null ? `${Number(p.taxPercent)}%` : "—"}
                </td>
                <td className="py-2 pr-4 text-slate-600">{p.scheme ?? "—"}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      p.active
                        ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                        : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500"
                    }
                  >
                    {p.active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <form action={toggleProductActive.bind(null, p.id, !p.active)}>
                    <button type="submit" className="text-sm font-semibold text-blue-700 hover:underline">
                      {p.active ? "Hide" : "Show"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={9} className="py-4 text-center text-slate-400">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
