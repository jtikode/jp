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

/** How many items to keep from a stock-sorted list so every in-stock/
 * untracked item survives the cut, even past the normal cap — only
 * low-stock/out-of-stock entries ever get truncated. */
export function alternativesCap<T extends { stock: number | null }>(sorted: T[], maxDefault: number): number {
  const inStockCount = sorted.filter((item) => stockTier(item.stock) === 0).length;
  return Math.max(maxDefault, inStockCount);
}
