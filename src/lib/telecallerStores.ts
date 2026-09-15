import { getOrgScopedDb } from "@/lib/orgScopedDb";

/**
 * A telecaller's own territory, same idea as a salesman's route assignment:
 * once admin assigns them a route, they see only that route's stores —
 * before that, they fall back to the existing org-wide behavior (the
 * admin-uploaded TelecallerParty list, or literally every store if that's
 * empty too), so nobody's call list goes blank just because they haven't
 * been migrated to route assignment yet.
 */
export async function getTelecallerStores(orgId: string, userId: string) {
  const db = getOrgScopedDb(orgId);

  const assignments = await db.routeAssignment.findMany({ where: { userId }, select: { routeId: true } });
  const routeIds = assignments.map((a) => a.routeId);

  if (routeIds.length > 0) {
    return db.store.findMany({ where: { routeId: { in: routeIds } }, orderBy: { name: "asc" } });
  }

  const partyCount = await db.telecallerParty.count();
  if (partyCount > 0) {
    const parties = await db.telecallerParty.findMany({ include: { store: true } });
    return parties.map((p) => p.store);
  }

  return db.store.findMany({ orderBy: { name: "asc" } });
}
