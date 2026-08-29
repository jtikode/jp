import Link from "next/link";
import { assertRole } from "@/lib/permissions";
import { getActiveCatalog } from "@/lib/productCatalog";
import { Card } from "@/components/ui/Card";
import { StockByCompanyDrug } from "@/components/admin/StockByCompanyDrug";

export const dynamic = "force-dynamic";

export default async function AdminStockPage() {
  const session = await assertRole(["ADMIN"]);
  const catalog = await getActiveCatalog(session.orgId);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/team/admin/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        ← Home
      </Link>

      <Card>
        <h1 className="text-xl font-bold text-slate-900">Stock Availability</h1>
        <p className="mt-1 text-sm text-slate-500">
          Check what&rsquo;s in stock company-wise, or find every product that carries a given drug/composition.
        </p>
      </Card>

      <Card>
        <StockByCompanyDrug
          products={catalog.map((p) => ({
            id: p.id,
            name: p.name,
            company: p.company,
            unit: p.unit,
            price: p.price,
            stock: p.stock,
            composition: p.composition,
          }))}
        />
      </Card>
    </div>
  );
}
