import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { getClientIp } from "@/lib/requestInfo";

export type RetailerLoginResult =
  | { ok: true; store: { id: string; name: string }; orgId: string }
  | { ok: false; error: string; status: number };

// Shared by the web login route (sets a cookie) and the mobile app login
// (returns a token), so both enforce exactly the same credential rules.
export async function authenticateRetailer(
  request: Request,
  input: { businessCode: string; loginId: string; pin: string },
): Promise<RetailerLoginResult> {
  const { businessCode, loginId, pin } = input;

  const org = await db.organization.findUnique({ where: { slug: businessCode.trim().toLowerCase() } });
  if (!org || !org.active) return { ok: false, error: "Invalid business code.", status: 401 };

  // Look up by the 4-digit login code first (the bulk-issued credential
  // every store now has); fall back to phone for any pre-existing account
  // that self-activated before this scheme, so it doesn't get locked out.
  const store = await db.store.findFirst({
    where: { orgId: org.id, OR: [{ loginCode: loginId.trim() }, { phone: loginId.trim() }] },
  });
  if (!store || !store.pinHash) {
    return { ok: false, error: "No activated shop account found for that Login Id.", status: 401 };
  }

  const valid = await verifyPassword(pin, store.pinHash);
  if (!valid) return { ok: false, error: "Invalid Login Id or Password.", status: 401 };

  await db.store.update({ where: { id: store.id }, data: { lastLoginAt: new Date() } });
  await db.loginEvent.create({
    data: {
      orgId: org.id,
      accountType: "RETAILER",
      storeId: store.id,
      displayName: store.name,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    },
  });

  return { ok: true, store: { id: store.id, name: store.name }, orgId: org.id };
}
