/** Rupees with paise only when there are any: ₹5,000 and ₹17,950.40, never ₹17,950.4. */
export function inr(n: number): string {
  const v = Math.round(n * 100) / 100;
  const whole = Number.isInteger(v);
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}
