// Shared conservative name-matching key for joining admin-uploaded, free-text
// item names (PurchaseHistoryItem, ExpiryItem) against real Product records.
// Exact match only, by design — a wrong match here means the wrong product's
// price or stock gets attributed, so no fuzzy matching is used.
export function normalizeName(name: string): string {
  return name.trim().toUpperCase().replace(/\s+/g, " ");
}
