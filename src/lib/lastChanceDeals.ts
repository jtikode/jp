import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { normalizeName } from "@/lib/normalizeName";
import { getStartOfIstDayUtc } from "@/lib/istTime";

// Near-expiry items that have a clearance rate, offered at the very end of an
// order ("last-chance deals", like the add-on strip at the end of a grocery
// app's cart). Same source and rules as the Clearance page: an ExpiryItem with a
// special rate that is below the normal rate, matched to a live product that is
// not out of stock. placeOrder re-checks all of this when the order is placed.
export interface LastChanceDeal {
  expiryItemId: string;
  productId: string;
  name: string;
  company: string | null;
  unit: string | null;
  normalPrice: number;
  specialRate: number;
  percentOff: number;
  stock: number | null;
  expiryDate: string;
  daysLeft: number;
}

export async function getLastChanceDeals(orgId: string): Promise<LastChanceDeal[]> {
  const db = getOrgScopedDb(orgId);
  const today = getStartOfIstDayUtc();
  const [expiryItems, products] = await Promise.all([
    db.expiryItem.findMany({
      where: { expiryDate: { gte: today }, specialRate: { not: null } },
      orderBy: { expiryDate: "asc" },
      take: 600,
    }),
    db.product.findMany({ where: { active: true }, select: { id: true, name: true, company: true, unit: true, price: true, stock: true } }),
  ]);
  const byName = new Map(products.map((p) => [normalizeName(p.name), p]));

  const best = new Map<string, LastChanceDeal>();
  for (const e of expiryItems) {
    const p = byName.get(normalizeName(e.itemName));
    if (!p || p.stock === 0) continue;
    const normal = Number(p.price);
    const special = Number(e.specialRate);
    if (!(special > 0) || !(special < normal)) continue;
    const deal: LastChanceDeal = {
      expiryItemId: e.id,
      productId: p.id,
      name: p.name,
      company: p.company,
      unit: p.unit,
      normalPrice: normal,
      specialRate: special,
      percentOff: Math.round(((normal - special) / normal) * 100),
      stock: p.stock,
      expiryDate: e.expiryDate.toISOString(),
      daysLeft: Math.ceil((e.expiryDate.getTime() - today.getTime()) / 86_400_000),
    };
    // One card per product: keep the batch that expires first.
    if (!best.has(p.id)) best.set(p.id, deal);
  }
  return [...best.values()].sort((a, b) => b.percentOff - a.percentOff).slice(0, 80);
}
