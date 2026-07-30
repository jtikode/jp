"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/permissions";

// A real visit photo isn't possible for a retroactively-entered day, so every
// backfilled Visit row uses this 1x1 pixel in place of one — schema requires
// photoUrl, and the user asked for these to look like ordinary visit rows.
const BACKFILL_PHOTO_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export interface BackfillDayEntry {
  date: string; // yyyy-MM-dd
  orderAmount?: number;
  collectionAmount?: number;
}

export async function saveBackfillEntries(
  storeId: string,
  entries: BackfillDayEntry[],
): Promise<{ ok: boolean; error?: string; savedCount?: number }> {
  const session = await assertRole(["SALESMAN"]);
  const userId = session.userId as string;

  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store) return { ok: false, error: "Store not found." };

  const latitude = store.latitude ?? 0;
  const longitude = store.longitude ?? 0;

  let savedCount = 0;
  for (const entry of entries) {
    const hasOrderAmount = entry.orderAmount != null && entry.orderAmount > 0;
    const hasCollectionAmount = entry.collectionAmount != null && entry.collectionAmount > 0;
    if (!hasOrderAmount && !hasCollectionAmount) continue;

    const dayStart = new Date(`${entry.date}T00:00:00`);
    const dayEnd = new Date(`${entry.date}T23:59:59.999`);

    const existing = await db.visit.findFirst({
      where: { userId, storeId, visitDate: { gte: dayStart, lte: dayEnd } },
    });

    const amounts = {
      collectionAmount: hasCollectionAmount ? entry.collectionAmount : null,
      orderAmount: hasOrderAmount ? entry.orderAmount : null,
      hasOrder: hasOrderAmount,
    };

    if (existing) {
      await db.visit.update({ where: { id: existing.id }, data: amounts });
    } else {
      await db.visit.create({
        data: {
          userId,
          storeId,
          routeId: store.routeId,
          visitDate: dayStart,
          latitude,
          longitude,
          photoUrl: BACKFILL_PHOTO_PLACEHOLDER,
          ...amounts,
        },
      });
    }
    savedCount += 1;
  }

  revalidatePath("/salesman/dashboard");
  revalidatePath("/salesman/calendar");
  revalidatePath("/salesman/july-catchup");
  revalidatePath("/admin/dashboard");
  return { ok: true, savedCount };
}
