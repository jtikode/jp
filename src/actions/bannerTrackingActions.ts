"use server";

import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertStoreSession } from "@/lib/retailerPermissions";

// Counts one "added this offer to the cart" for the admin's offer stats. Pure
// bookkeeping: any failure is swallowed so it can never get in the way of the
// retailer's add-to-cart tap.
export async function trackOfferAdd(bannerId: string): Promise<void> {
  try {
    const session = await assertStoreSession();
    const db = getOrgScopedDb(session.orgId);
    const banner = await db.shopBanner.findFirst({ where: { id: bannerId }, select: { id: true } });
    if (!banner) return;
    await db.bannerEvent.create({
      data: { orgId: session.orgId, bannerId, storeId: session.storeId, kind: "ADD_TO_CART" },
    });
  } catch {
    // Intentionally ignored.
  }
}
