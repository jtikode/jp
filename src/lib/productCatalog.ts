import { unstable_cache } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";

export interface CatalogProduct {
  id: string;
  name: string;
  company: string | null;
  unit: string | null;
  price: number;
  mrp: number | null;
  taxPercent: number | null;
  scheme: string | null;
  composition: string | null;
  stock: number | null;
  // Soonest expiry across this product's batches, from the last stock &
  // expiry upload — shown as a fallback whenever the item isn't one of the
  // curated Clearance picks (which carry their own, possibly more current,
  // expiryDate via ExpiryItem).
  nearestExpiry: string | null;
}

// Shared, cached read of an org's active catalog. Every retailer-facing
// browse/compare page (products, lowest-rate, hot-selling/dead-stock
// scoring) reads from this instead of hitting Postgres directly, so many
// concurrent retailers share one query per org instead of each triggering
// their own full-table scan. Purely a display cache — placeOrder always
// re-reads Product.price fresh from the database at submit time, so a
// price shown here being up to a minute stale can never change what a
// retailer is actually charged.
const getCachedActiveCatalog = unstable_cache(
  async (orgId: string): Promise<CatalogProduct[]> => {
    const db = getOrgScopedDb(orgId);
    const products = await db.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        company: true,
        unit: true,
        price: true,
        mrp: true,
        taxPercent: true,
        scheme: true,
        composition: true,
        stock: true,
        nearestExpiry: true,
      },
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      company: p.company,
      unit: p.unit,
      price: Number(p.price),
      mrp: p.mrp != null ? Number(p.mrp) : null,
      taxPercent: p.taxPercent != null ? Number(p.taxPercent) : null,
      scheme: p.scheme,
      composition: p.composition,
      nearestExpiry: p.nearestExpiry != null ? p.nearestExpiry.toISOString() : null,
      stock: p.stock,
    }));
  },
  ["active-catalog"],
  { revalidate: 60 },
);

export function getActiveCatalog(orgId: string): Promise<CatalogProduct[]> {
  return getCachedActiveCatalog(orgId);
}
