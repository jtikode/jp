import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { CNF_COMPANIES, CNF_GROUPS, CNF_OVERSTOCK_QTY, CNF_OVERSTOCK_VALUE, cnfGroupOf } from "@/lib/cnf/config";

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

/** Purchase rate plus a percentage (0 = purchase rate), never above the normal rate. */
function distributorPrice(price: number, purchaseRate: number | null, percent: number): number {
  if (!purchaseRate || purchaseRate <= 0 || price <= 0) return price;
  const candidate = Math.round(purchaseRate * (1 + percent / 100) * 100) / 100;
  return candidate < price ? candidate : price;
}

/**
 * The portal ranges, priced for one distributor. DKT takes the distributor's own
 * percentage; every other range has its own fixed percentage (see CNF_GROUPS).
 * The purchase rate is read here and only the final price leaves the server. Items with no selling rate
 * or no purchase rate are left out (nothing to charge, or no way to price them for a distributor),
 * and no price is ever above the normal rate.
 */
export async function loadCnfCatalog(orgId: string, percent: number): Promise<CnfProduct[]> {
  const db = getOrgScopedDb(orgId);
  // Overstocked products (any company) join the "More products" range: over CNF_OVERSTOCK_QTY units,
  // or stock value at purchase rate over CNF_OVERSTOCK_VALUE.
  const stocked = await db.product.findMany({
    where: { active: true, price: { gt: 0 }, purchaseRate: { gt: 0 }, stock: { gt: 0 } },
    select: { id: true, stock: true, purchaseRate: true },
  });
  const overstockIds = new Set(
    stocked
      .filter((r) => (r.stock ?? 0) > CNF_OVERSTOCK_QTY || (r.stock ?? 0) * Number(r.purchaseRate) > CNF_OVERSTOCK_VALUE)
      .map((r) => r.id),
  );
  const rows = await db.product.findMany({
    where: {
      active: true,
      price: { gt: 0 },
      purchaseRate: { gt: 0 },
      OR: [
        { company: { in: [...CNF_COMPANIES] } },
        // Omee is picked by name: its company is Alkem, which is not a portal range.
        { name: { startsWith: "OMEE", mode: "insensitive" } },
        // "More products": overstock of any company.
        { id: { in: [...overstockIds] } },
      ],
    },
    select: { id: true, name: true, company: true, unit: true, price: true, purchaseRate: true, mrp: true, taxPercent: true, stock: true },
    orderBy: [{ company: "asc" }, { name: "asc" }],
  });

  const out: CnfProduct[] = [];
  const seen = new Set<string>();
  // Old imports left a second copy of some products with no company: the copy
  // that has a company wins, so rows with a company are walked first.
  rows.sort((a, b) => Number(b.company != null) - Number(a.company != null));
  for (const r of rows) {
    const group = cnfGroupOf(r.company, r.name, overstockIds.has(r.id));
    if (!group) continue;
    const name = r.name.replace(/\s+/g, " ").trim();
    if (!r.company) {
      if (seen.has(name.toUpperCase())) continue;
    }
    seen.add(name.toUpperCase());
    out.push({
      id: r.id,
      name,
      group: group.slug,
      company: r.company ?? "",
      unit: r.unit,
      mrp: r.mrp != null ? Number(r.mrp) : null,
      taxPercent: r.taxPercent != null ? Number(r.taxPercent) : null,
      stock: r.stock,
      price: distributorPrice(Number(r.price), r.purchaseRate != null ? Number(r.purchaseRate) : null, group.fixedPercent ?? percent),
    });
  }
  out.sort((a, b) => CNF_GROUPS.findIndex((g) => g.slug === a.group) - CNF_GROUPS.findIndex((g) => g.slug === b.group) || a.company.localeCompare(b.company) || a.name.localeCompare(b.name));
  return out;
}
