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

  const routeStores = await db.routeStore.findMany({
    where: { routeId },
    orderBy: [{ visitSequence: { sort: "asc", nulls: "last" } }, { store: { name: "asc" } }],
  });

  const index = routeStores.findIndex((rs) => rs.storeId === storeId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= routeStores.length) return;

  const a = routeStores[index];
  const b = routeStores[swapIndex];
  // Swap just the two affected rows' sequence numbers — falling back to their
  // current list position for any store that's never had one assigned yet.
  const aSeq = a.visitSequence ?? index + 1;
  const bSeq = b.visitSequence ?? swapIndex + 1;

  await Promise.all([
    db.routeStore.update({ where: { id: a.id }, data: { visitSequence: bSeq } }),
    db.routeStore.update({ where: { id: b.id }, data: { visitSequence: aSeq } }),
  ]);

  revalidatePath("/admin/stores");
}

export async function assignStoreToRoute(
  routeId: string,
  storeId: string,
): Promise<{ ok: boolean; error?: string }> {
  await assertRole(["ADMIN"]);

  const existing = await db.routeStore.findUnique({
    where: { routeId_storeId: { routeId, storeId } },
  });
  if (existing) {
    return { ok: false, error: "That store is already on this route." };
  }

  const count = await db.routeStore.count({ where: { routeId } });

  await db.routeStore.create({
    data: { routeId, storeId, visitSequence: count + 1 },
  });

  revalidatePath("/admin/stores");
  return { ok: true };
}

/** Persists a full drag-and-drop reorder in one go: sets visitSequence = position for every store, in the given order. */
export async function reorderAllStores(routeId: string, orderedStoreIds: string[]): Promise<void> {
  await assertRole(["ADMIN"]);

  await Promise.all(
    orderedStoreIds.map((storeId, index) =>
      db.routeStore.update({
        where: { routeId_storeId: { routeId, storeId } },
        data: { visitSequence: index + 1 },
      }),
    ),
  );

  revalidatePath("/admin/stores");
}

export async function assignMultipleStoresToRoute(
  routeId: string,
  storeIds: string[],
): Promise<{ ok: boolean; error?: string; addedCount?: number }> {
  await assertRole(["ADMIN"]);

  if (storeIds.length === 0) {
    return { ok: false, error: "Choose at least one store." };
  }

  const existing = await db.routeStore.findMany({
    where: { routeId, storeId: { in: storeIds } },
    select: { storeId: true },
  });
  const existingIds = new Set(existing.map((e) => e.storeId));
  const toAdd = storeIds.filter((id) => !existingIds.has(id));

  if (toAdd.length === 0) {
    return { ok: false, error: "Those stores are already on this route." };
  }

  let count = await db.routeStore.count({ where: { routeId } });
  for (const storeId of toAdd) {
    count += 1;
    await db.routeStore.create({ data: { routeId, storeId, visitSequence: count } });
  }

  revalidatePath("/admin/stores");
  return { ok: true, addedCount: toAdd.length };
}

export async function removeStoreFromRoute(
  routeId: string,
  storeId: string,
): Promise<{ ok: boolean; error?: string }> {
  await assertRole(["ADMIN"]);

  await db.routeStore.delete({ where: { routeId_storeId: { routeId, storeId } } });

  revalidatePath("/admin/stores");
  return { ok: true };
}
