"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/permissions";

export async function reorderStoreSequence(
  routeId: string,
  storeId: string,
  direction: "up" | "down",
): Promise<void> {
  await assertRole(["ADMIN"]);

  const stores = await db.store.findMany({
    where: { routeId },
    orderBy: [{ visitSequence: { sort: "asc", nulls: "last" } }, { name: "asc" }],
  });

  const index = stores.findIndex((s) => s.id === storeId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= stores.length) return;

  const a = stores[index];
  const b = stores[swapIndex];
  // Swap just the two affected rows' sequence numbers — falling back to their
  // current list position for any store that's never had one assigned yet.
  const aSeq = a.visitSequence ?? index + 1;
  const bSeq = b.visitSequence ?? swapIndex + 1;

  await Promise.all([
    db.store.update({ where: { id: a.id }, data: { visitSequence: bSeq } }),
    db.store.update({ where: { id: b.id }, data: { visitSequence: aSeq } }),
  ]);

  revalidatePath("/admin/stores");
}
