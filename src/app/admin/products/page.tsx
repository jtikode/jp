import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { AddProductForm } from "@/components/admin/AddProductForm";
import { FileImportForm } from "@/components/admin/FileImportForm";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { importProducts } from "@/actions/productActions";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";

export default async function AdminProductsPage() {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const products = await db.product.findMany({
    orderBy: [{ company: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Add a single product</h2>
        <AddProductForm />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Upload product list</h2>
        <p className="mb-4 text-sm text-slate-500">
          Excel/CSV with item name, price, and optional company/unit/M.R.P./tax/scheme/composition
          columns. Re-uploading updates existing products by name (including price) rather than
          duplicating them.
        </p>
        <FileImportForm action={importProducts} buttonLabel="Upload product list" itemLabel="products" />
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Catalog ({products.length})</h2>
          <ExportExcelButton
            data={products.map((p) => ({
              Company: p.company ?? "",
              Product: p.name,
              Composition: p.composition ?? "",
              Unit: p.unit ?? "",
              Rate: Number(p.price),
              MRP: p.mrp != null ? Number(p.mrp) : "",
              "Tax %": p.taxPercent != null ? Number(p.taxPercent) : "",
              Scheme: p.scheme ?? "",
              Stock: p.stock ?? "",
              Status: p.active ? "Active" : "Hidden",
            }))}
            filename="products"
          />
        </div>
        <ProductsTable
          products={products.map((p) => ({
            id: p.id,
            company: p.company,
            name: p.name,
            composition: p.composition,
            unit: p.unit,
            price: Number(p.price),
            mrp: p.mrp != null ? Number(p.mrp) : null,
            taxPercent: p.taxPercent != null ? Number(p.taxPercent) : null,
            scheme: p.scheme,
            stock: p.stock,
            active: p.active,
          }))}
        />
      </Card>
    </div>
  );
}
