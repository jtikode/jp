import { unstable_cache } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { normalizeName } from "@/lib/normalizeName";
import { getActiveCatalog } from "@/lib/productCatalog";

const HOT_SELLING_COUNT = 50;
const DEAD_STOCK_COUNT = 100;

// "Selling more"/"not selling" both come from the same combined signal:
// units actually ordered through the app (OrderItem, org-wide across every
// store) plus admin-uploaded historical purchase data (PurchaseHistoryItem,
// matched to the catalog by exact normalized name — the same conservative
// match used for Fast Order and the stock import). Products absent from the
// returned map simply have a score of 0 — they were never sold in either source.
//
// This was previously recomputed from scratch (two org-wide groupBy scans)
// on every single catalog page load, for every retailer — cached here so
// many concurrent retailers share one computation instead of each
// triggering their own full order-history scan.
const getCachedProductSalesScores = unstable_cache(
  async (orgId: string): Promise<[string, number][]> => {
    const db = getOrgScopedDb(orgId);

    const [orderedGroups, historyGroups, catalog] = await Promise.all([
      db.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
      }),
      db.purchaseHistoryItem.groupBy({
        by: ["itemName"],
        _sum: { quantity: true },
      }),
      getActiveCatalog(orgId),
    ]);

    const productByNormalizedName = new Map(catalog.map((p) => [normalizeName(p.name), p.id]));
    const scoreByProductId = new Map<string, number>();

    for (const g of orderedGroups) {
      const qty = Number(g._sum.quantity ?? 0);
      scoreByProductId.set(g.productId, (scoreByProductId.get(g.productId) ?? 0) + qty);
    }
    for (const g of historyGroups) {
      const productId = productByNormalizedName.get(normalizeName(g.itemName));
      if (!productId) continue;
      const qty = Number(g._sum.quantity ?? 0);
      scoreByProductId.set(productId, (scoreByProductId.get(productId) ?? 0) + qty);
    }

    return [...scoreByProductId.entries()];
  },
  ["product-sales-scores"],
  { revalidate: 300 },
);

async function getProductSalesScores(orgId: string): Promise<Map<string, number>> {
  return new Map(await getCachedProductSalesScores(orgId));
}

// Top HOT_SELLING_COUNT products by combined sales volume get marked hot.
export async function getHotSellingProductIds(orgId: string): Promise<Set<string>> {
  const scores = await getProductSalesScores(orgId);

  const ranked = [...scores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, HOT_SELLING_COUNT)
    .map(([productId]) => productId);

  return new Set(ranked);
}

export interface DeadStockProduct {
  id: string;
  name: string;
  company: string | null;
  unit: string | null;
  price: number;
  stock: number;
  tiedUpValue: number;
}

// Stock sitting on the shelf with zero recorded sales (neither an in-app
// order nor a line in the uploaded purchase history) — ranked by how much
// money is tied up in it (stock * rate), highest first, since that's what
// makes a slow mover worth admin's attention over a random unsold item.
export async function getDeadStockProducts(orgId: string): Promise<DeadStockProduct[]> {
  const [scores, catalog] = await Promise.all([
    getProductSalesScores(orgId),
    getActiveCatalog(orgId),
  ]);

  return catalog
    .filter((p) => p.stock != null && p.stock > 0 && (scores.get(p.id) ?? 0) === 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      company: p.company,
      unit: p.unit,
      price: p.price,
      stock: p.stock as number,
      tiedUpValue: p.price * (p.stock as number),
    }))
    .sort((a, b) => b.tiedUpValue - a.tiedUpValue)
    .slice(0, DEAD_STOCK_COUNT);
}
