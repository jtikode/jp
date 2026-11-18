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
 * are left out (nothing to charge). Items with no purchase rate are left out too, unless they are
 * overstocked: those are sold at the normal rate. No price is ever above the normal rate.
 */
export async function loadCnfCatalog(orgId: string, percent: number): Promise<CnfProduct[]> {
  const db = getOrgScopedDb(orgId);
  // Overstocked products (any company) join the portal: over CNF_OVERSTOCK_QTY units, or stock value
  // over CNF_OVERSTOCK_VALUE (at purchase rate, or at the selling rate when there is none). Those with
  // no purchase rate are sold at the normal rate, since no distributor rate can be worked out.
  const stocked = await db.product.findMany({
    where: { active: true, price: { gt: 0 }, stock: { gt: 0 } },
    select: { id: true, stock: true, price: true, purchaseRate: true },
  });
  const overstockIds = new Set(
    stocked
      .filter((r) => {
        const units = r.stock ?? 0;
        const rate = Number(r.purchaseRate) > 0 ? Number(r.purchaseRate) : Number(r.price);
        return units > CNF_OVERSTOCK_QTY || units * rate > CNF_OVERSTOCK_VALUE;
      })
      .map((r) => r.id),
  );
  const rows = await db.product.findMany({
    where: {
      active: true,
      price: { gt: 0 },
      OR: [
        // The ranges: only items with a purchase rate, so a distributor rate can be worked out.
        {
          purchaseRate: { gt: 0 },
          OR: [
            { company: { in: [...CNF_COMPANIES] } },
            // Omee is picked by name: its company is Alkem, which is not a portal range.
            { name: { startsWith: "OMEE", mode: "insensitive" } },
          ],
        },
        // Overstock of any company, with or without a purchase rate.
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
