"use client";

// Shared add-to-cart control used everywhere a retailer picks a quantity
// (catalog, lowest-rate, clearance, quick check, alternatives). At 0 it's a
// single "+" — nothing to decrement or type yet. Once a quantity exists it
// expands into a full −/type/+ stepper; the middle number is a real input,
// not just a label, so a retailer ordering 50 of something can type "50"
// instead of tapping + fifty times.
export function QuantityStepper({
  quantity,
  onChange,
  accentClassName = "bg-blue-700 hover:bg-blue-800",
  compact = false,
  max,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  accentClassName?: string;
  compact?: boolean;
  // Caps both the + button and typed input — used for Wednesday Deals'
  // per-retailer quantity limit. The server re-enforces this independently
  // at checkout, so this is just a helpful client-side guardrail.
  max?: number;
}) {
  const buttonSize = compact ? "h-8 w-8" : "h-9 w-9";
  const inputWidth = compact ? "w-8" : "w-10";
  const clamp = (n: number) => (max != null ? Math.min(n, max) : n);

  if (max != null && max <= 0) {
    return (
      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
        Limit reached
      </span>
    );
  }

  if (quantity <= 0) {
    return (
      <button
        type="button"
        onClick={() => onChange(clamp(1))}
        className={`flex ${buttonSize} shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${accentClassName}`}
        aria-label="Add"
      >
        +
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full border-2 border-slate-200 p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, quantity - 1))}
        className={`flex ${buttonSize} items-center justify-center rounded-full text-lg font-bold text-slate-700 hover:bg-slate-100`}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        max={max}
        inputMode="numeric"
        value={quantity}
        onChange={(e) => onChange(clamp(Math.max(0, Math.floor(Number(e.target.value) || 0))))}
        onFocus={(e) => e.target.select()}
        className={`${inputWidth} border-0 bg-transparent text-center text-base font-semibold text-slate-900 focus:outline-none`}
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(quantity + 1))}
        disabled={max != null && quantity >= max}
        className={`flex ${buttonSize} items-center justify-center rounded-full text-lg font-bold text-white ${accentClassName} disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
