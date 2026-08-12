const ACTIVE_WINDOW_DAYS = 30;

export interface ShopActivityStatus {
  label: string;
  className: string;
}

// Buckets a store's retailer-shop usage into a small set of admin-facing
// states — not activated, active, or gone quiet — so admin can see who's
// actually using the shop without reading raw timestamps.
export function shopActivityStatus(shopActivated: boolean, lastLoginAtIso: string | null): ShopActivityStatus {
  if (!shopActivated || !lastLoginAtIso) {
    return { label: "Not on App", className: "bg-slate-100 text-slate-500" };
  }

  const daysSince = (Date.now() - new Date(lastLoginAtIso).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= ACTIVE_WINDOW_DAYS) {
    return { label: `Active · ${formatRelative(daysSince)}`, className: "bg-green-100 text-green-700" };
  }
  return { label: `Inactive · ${formatRelative(daysSince)}`, className: "bg-amber-100 text-amber-800" };
}

function formatRelative(days: number): string {
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 30) return `${Math.floor(days)}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
