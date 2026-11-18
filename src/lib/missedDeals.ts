import { getOrgScopedDb } from "@/lib/orgScopedDb";

export interface MissedDeal {
  id: string;
  imageUrl: string;
  title: string | null;
  endedAt: Date;
  /** Distinct shops that ordered through this offer while it was live. */
  grabbedBy: number;
  /** True when the viewing shop was one of them. */
  youGotIt: boolean;
}

const WINDOW_DAYS = 30;

/**
 * Offers that ran out recently — shown back to retailers (greyed, marked
 * "ENDED") so they see what they missed and watch for the next one. Only
 * time-boxed offers still marked active count: an offer an admin switched off
 * was withdrawn, not missed. The "grabbed by" figure is real, counted from
 * orders placed through the offer (cancelled orders excluded).
 */
export async function getMissedDeals(orgId: string, storeId: string, limit = 8): Promise<MissedDeal[]> {
  const db = getOrgScopedDb(orgId);
  const now = new Date();
  const since = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const banners = await db.shopBanner.findMany({
    where: { placement: "OFFER", active: true, expiresAt: { lt: now, gte: since } },
    orderBy: { expiresAt: "desc" },
    take: limit,
    select: { id: true, imageUrl: true, title: true, expiresAt: true },
  });
  if (banners.length === 0) return [];

  const items = await db.orderItem.findMany({
    where: { bannerId: { in: banners.map((b) => b.id) }, order: { status: { not: "CANCELLED" } } },
    select: { bannerId: true, order: { select: { storeId: true } } },
  });
  const storesByBanner = new Map<string, Set<string>>();
  for (const it of items) {
    if (!it.bannerId) continue;
    const set = storesByBanner.get(it.bannerId) ?? new Set<string>();
    set.add(it.order.storeId);
    storesByBanner.set(it.bannerId, set);
  }

  return banners.map((b) => {
    const stores = storesByBanner.get(b.id);
    return {
      id: b.id,
      imageUrl: b.imageUrl,
      title: b.title,
      endedAt: b.expiresAt as Date,
      grabbedBy: stores?.size ?? 0,
      youGotIt: stores?.has(storeId) ?? false,
    };
  });
}
