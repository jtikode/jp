// Shared by the live search, the offline snapshot fallback, and the client
// list itself — kept dependency-free so it's safe to import from anywhere
// (server or client) without dragging in unrelated modules.
export const LOW_STOCK_THRESHOLD = 3;

// Untracked stock is treated the same as "in stock" everywhere else in the
// shop (it's never hidden from browsing, never shows a low-stock badge), so
// it ranks alongside genuinely in-stock items here too.
export function stockTier(stock: number | null): number {
  if (stock == null || stock >= LOW_STOCK_THRESHOLD) return 0;
  if (stock > 0) return 1;
  return 2;
}

/** In-stock items first, then low-stock, then out-of-stock — ties broken by name. */
export function byStockThenName<T extends { stock: number | null; name: string }>(a: T, b: T): number {
  const tierDiff = stockTier(a.stock) - stockTier(b.stock);
  if (tierDiff !== 0) return tierDiff;
  return a.name.localeCompare(b.name);
}

// The first standalone number in a product name — almost always the dose
// (e.g. "40" out of "ATORSTIN 40MG TAB Atorvastatin 10'S", or "LIPVAS 40
// TAB" where the "MG" unit is left out entirely, which most brands do).
// There's no structured dosage field — this is a best-effort read of the
// same free-text name shown to the retailer, deliberately ignoring the unit
// (brands are inconsistent about writing "MG" at all, but within one salt's
// alternatives the unit is always the same anyway). Returns null for names
// with no leading number, which just falls back to the plain stock/name
// order below.
export function extractStrength(name: string): string | null {
  const match = name.match(/\d+(?:\.\d+)?/);
  return match ? match[0] : null;
}

/** Ranking for the "alternatives" list: available stock always comes first
 * (a retailer can only order what's actually here), then — within the same
 * stock tier — a same-strength match (e.g. other 40MG options before 10MG
 * ones), then name. Strength used to outrank stock, which pushed same-dose
 * out-of-stock items above in-stock ones of a slightly different dose. */
export function byStockThenStrengthMatchThenName<T extends { stock: number | null; name: string }>(
  referenceName: string,
): (a: T, b: T) => number {
  const refStrength = extractStrength(referenceName);
  return (a, b) => {
    const tierDiff = stockTier(a.stock) - stockTier(b.stock);
    if (tierDiff !== 0) return tierDiff;
    if (refStrength) {
      const aMatches = extractStrength(a.name) === refStrength;
      const bMatches = extractStrength(b.name) === refStrength;
      if (aMatches !== bMatches) return aMatches ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  };
}

/** How many items to keep from a stock-sorted list so every in-stock/
 * untracked item survives the cut, even past the normal cap — only
 * low-stock/out-of-stock entries ever get truncated. */
export function alternativesCap<T extends { stock: number | null }>(sorted: T[], maxDefault: number): number {
  const inStockCount = sorted.filter((item) => stockTier(item.stock) === 0).length;
  return Math.max(maxDefault, inStockCount);
}
