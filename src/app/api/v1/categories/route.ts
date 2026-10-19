import { apiHandler } from "@/lib/apiHandler";
import { assertStoreSession } from "@/lib/retailerPermissions";
import { getCategoryTileCounts } from "@/lib/productSearch";
import { CATEGORY_TILES } from "@/lib/categoryTiles";

// The "Shop by category" tiles for the mobile app, in display order, with how
// many products are in each (empty tiles are left out).
export function GET() {
  return apiHandler(async () => {
    const session = await assertStoreSession();
    const counts = await getCategoryTileCounts(session.orgId);
    return {
      categories: CATEGORY_TILES.filter((c) => (counts.get(c.slug)?.total ?? 0) > 0).map((c) => ({
        slug: c.slug,
        en: c.en,
        mr: c.mr,
        inStock: counts.get(c.slug)!.inStock,
      })),
    };
  });
}
