"use server";

import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole, ROLE_HOME } from "@/lib/permissions";
import { getRetailerSession } from "@/lib/retailerSession";

// Admins and salesmen can take an order for any party exactly the way the
// party would in the shop app: this opens the shop in that party's name
// (a retailer session tagged with who is booking) and the normal cart,
// checkout and order flow does the rest.
const ORDER_ROLES = ["ADMIN", "SALESMAN"] as const;

export interface OrderPartyOption {
  id: string;
  name: string;
  address: string;
  code: string | null;
  routeName: string | null;
}

export async function searchPartiesForOrder(query: string): Promise<OrderPartyOption[]> {
  const me = await assertRole([...ORDER_ROLES]);
  const q = query.trim();
  if (q.length < 2) return [];
  const db = getOrgScopedDb(me.orgId);
  const stores = await db.store.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { externalCode: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    },
    select: { id: true, name: true, address: true, externalCode: true, route: { select: { name: true } } },
    orderBy: { name: "asc" },
    take: 20,
  });
  return stores.map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    code: s.externalCode,
    routeName: s.route?.name ?? null,
  }));
}

export async function startOrderingForParty(storeId: string): Promise<{ ok: boolean; error?: string }> {
  const me = await assertRole([...ORDER_ROLES]);
  const db = getOrgScopedDb(me.orgId);
  const store = await db.store.findFirst({ where: { id: storeId }, select: { id: true, name: true } });
  if (!store) return { ok: false, error: "That party was not found." };

  const session = await getRetailerSession();
  session.storeId = store.id;
  session.orgId = me.orgId;
  session.storeName = store.name;
  session.bookedBy = me.name ?? "Staff";
  session.bookedByRole = me.role;
  await session.save();
  return { ok: true };
}

/** Ends a booking session and returns where the staff member should land. */
export async function stopOrderingForParty(): Promise<{ redirectTo: string }> {
  const me = await assertRole([...ORDER_ROLES]);
  const session = await getRetailerSession();
  // Only tear down a session this staff flow created, never a real retailer login.
  if (session.bookedBy) session.destroy();
  return { redirectTo: ROLE_HOME[me.role] };
}
