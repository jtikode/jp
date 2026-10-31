import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { specialPrice } from "@/lib/storeRates";
import { CNF_COMPANIES, cnfGroupOf } from "@/lib/cnf/config";

export interface CnfProduct {
  id: string;
  name: string;
  group: string;
  company: string;
  unit: string | null;
  mrp: number | null;
  taxPercent: number | null;
  stock: number | null;
  /** What this distributor pays per unit. */
  price: number;
}

/**
 * The four portal ranges, priced for one distributor. The purchase rate is read
 * here and only the final price leaves the server. Items with no selling rate
 * are left out (nothing to charge); items with no usable purchase rate stay at
 * the normal rate, and no price is ever above the normal rate.
 */
export async function loadCnfCatalog(orgId: string, percent: number): Promise<CnfProduct[]> {
  const db = getOrgScopedDb(orgId);
  const rows = await db.product.findMany({
    where: { active: true, company: { in: [...CNF_COMPANIES] }, price: { gt: 0 } },
    select: { id: true, name: true, company: true, unit: true, price: true, purchaseRate: true, mrp: true, taxPercent: true, stock: true },
    orderBy: [{ company: "asc" }, { name: "asc" }],
  });

  const out: CnfProduct[] = [];
  for (const r of rows) {
    const group = cnfGroupOf(r.company);
    if (!group || !r.company) continue;
    out.push({
      id: r.id,
      name: r.name.replace(/\s+/g, " ").trim(),
      group: group.slug,
      company: r.company,
      unit: r.unit,
      mrp: r.mrp != null ? Number(r.mrp) : null,
      taxPercent: r.taxPercent != null ? Number(r.taxPercent) : null,
      stock: r.stock,
      price: specialPrice(Number(r.price), r.purchaseRate != null ? Number(r.purchaseRate) : null, percent),
    });
  }
  return out;
}
