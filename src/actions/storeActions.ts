"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";
import { shopLoginPassword } from "@/lib/shopLoginCode";

function randomFourDigitCode(taken: Set<string>): string {
  let code: string;
  do {
    code = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  } while (taken.has(code));
  taken.add(code);
  return code;
}

/**
 * Bulk-issues a 4-digit shop login code (password = code reversed) to every
 * store that doesn't have one yet, instead of waiting on retailer
 * self-registration. Reuses the existing Store row, so any order the
 * retailer later places links straight into the same store's history already
 * visible in Admin/Telecaller.
 */
export async function generateShopLoginCredentials(): Promise<{ ok: boolean; generatedCount: number }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const [needCodes, haveCodes] = await Promise.all([
    db.store.findMany({ where: { loginCode: null }, select: { id: true } }),
    db.store.findMany({ where: { loginCode: { not: null } }, select: { loginCode: true } }),
  ]);
  if (needCodes.length === 0) return { ok: true, generatedCount: 0 };

  const taken = new Set(haveCodes.map((s) => s.loginCode as string));

  const CONCURRENCY = 25;
  for (let i = 0; i < needCodes.length; i += CONCURRENCY) {
    const batch = needCodes.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (store) => {
        const code = randomFourDigitCode(taken);
        const pinHash = await hashPassword(shopLoginPassword(code));
        await db.store.update({ where: { id: store.id }, data: { loginCode: code, pinHash } });
      }),
    );
  }

  revalidatePath("/team/admin/stores");
  revalidatePath("/team/admin/shop-logins");
  return { ok: true, generatedCount: needCodes.length };
}

export async function reorderStoreSequence(
  routeId: string,
  storeId: string,
  direction: "up" | "down",
): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

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

  revalidatePath("/team/admin/stores");
}

export async function assignStoreToRoute(
  routeId: string,
  storeId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const existing = await db.routeStore.findUnique({
    where: { routeId_storeId: { routeId, storeId } },
  });
  if (existing) {
    return { ok: false, error: "That store is already on this route." };
  }

  const count = await db.routeStore.count({ where: { routeId } });

  await db.routeStore.create({
    data: { orgId: session.orgId, routeId, storeId, visitSequence: count + 1 },
  });

  revalidatePath("/team/admin/stores");
  return { ok: true };
}

/** Persists a full drag-and-drop reorder in one go: sets visitSequence = position for every store, in the given order. */
export async function reorderAllStores(routeId: string, orderedStoreIds: string[]): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await Promise.all(
    orderedStoreIds.map((storeId, index) =>
      db.routeStore.update({
        where: { routeId_storeId: { routeId, storeId } },
        data: { visitSequence: index + 1 },
      }),
    ),
  );

  revalidatePath("/team/admin/stores");
}

export async function assignMultipleStoresToRoute(
  routeId: string,
  storeIds: string[],
): Promise<{ ok: boolean; error?: string; addedCount?: number }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

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
    await db.routeStore.create({ data: { orgId: session.orgId, routeId, storeId, visitSequence: count } });
  }

  revalidatePath("/team/admin/stores");
  return { ok: true, addedCount: toAdd.length };
}

export async function removeStoreFromRoute(
  routeId: string,
  storeId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.routeStore.delete({ where: { routeId_storeId: { routeId, storeId } } });

  revalidatePath("/team/admin/stores");
  return { ok: true };
}
