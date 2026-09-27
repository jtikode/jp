import { db } from "@/lib/db";

// This deployment only ever serves one distributor (see the hardcoded
// BUSINESS_CODE on the shop login page), so any public, unauthenticated page
// that needs an orgId to scope its query — no retailer session exists yet —
// resolves it here instead of threading a business code through the URL.
// Revert to a real lookup once this app serves more than one distributor.
let cachedOrgId: Promise<string> | null = null;

export function getDefaultOrgId(): Promise<string> {
  if (!cachedOrgId) {
    cachedOrgId = db.organization
      .findFirstOrThrow({ where: { active: true }, select: { id: true } })
      .then((org) => org.id);
    // A failed lookup must not be cached — let the next call retry.
    cachedOrgId.catch(() => {
      cachedOrgId = null;
    });
  }
  return cachedOrgId;
}
