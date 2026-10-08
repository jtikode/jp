import type { CartLine, FreeItemSpec, OtcBrand, OtcRule, OtcSheet, OtcSku } from "./types";

export interface PricedLine {
  key: string;
  brandId: string;
  brandTitle: string;
  skuId: string;
  priceIdx: number;
  option?: string;
  name: string;
  mrp: number;
  /** Rate per unit actually billed (net rate when the sheet gives one). */
  unit: number;
  /** Paid units. */
  qty: number;
  /** Extra units given free on this line by a buy-N-get-M scheme. */
  freeQty: number;
  amount: number;
  discount: number;
  lineTotal: number;
}

export interface AppliedScheme {
  brandId: string;
  label: string;
  /** Rupees taken off, 0 for pure free-unit schemes. */
  amount: number;
}

export interface FreeLine {
  brandId: string;
  skuId?: string;
  priceIdx: number;
  name: string;
  qty: number;
  label: string;
}

export interface EvalResult {
  lines: PricedLine[];
  applied: AppliedScheme[];
  freeLines: FreeLine[];
  gifts: { brandId: string; text: string }[];
  hints: { brandId: string; text: string }[];
  subtotal: number;
  discountTotal: number;
  total: number;
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineKey(line: { skuId: string; priceIdx: number; option?: string }): string {
  return `${line.skuId}#${line.priceIdx}${line.option ? `#${line.option}` : ""}`;
}

export function findSku(sheet: OtcSheet, skuId: string): { brand: OtcBrand; sku: OtcSku } | null {
  for (const brand of sheet.brands) {
    const sku = brand.skus.find((s) => s.id === skuId);
    if (sku) return { brand, sku };
  }
  return null;
}

export const inr = (n: number) => `₹${round2(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Work extends PricedLine {
  group?: string;
}

type Scoped = Exclude<OtcRule, { kind: "note" }>;

function freeSpecLine(brandId: string, spec: FreeItemSpec, times: number, label: string): FreeLine {
  return { brandId, skuId: spec.skuId, priceIdx: spec.priceIdx ?? 0, name: spec.name, qty: spec.qty * times, label };
}

function pctText(tier: { pct?: number; pctBy?: Record<string, number> }): string {
  return tier.pctBy ? Object.entries(tier.pctBy).map(([g, p]) => `${g} ${p}%`).join(", ") : `${tier.pct ?? 0}%`;
}

/** Prices a cart against one sheet: line rates, scheme discounts, free units and
 *  gifts, plus "add N more" hints. Pure so it can run in the browser for the
 *  live cart and again on the server when the order is placed. Each rule works
 *  on the undiscounted line amounts, so several schemes on one brand add up
 *  rather than compound. */
export function evaluateCart(sheet: OtcSheet, cart: CartLine[]): EvalResult {
  const lines: Work[] = [];
  for (const c of cart) {
    if (!(c.qty > 0)) continue;
    const found = findSku(sheet, c.skuId);
    const price = found?.sku.prices[c.priceIdx];
    if (!found || !price) continue;
    const unit = price.net ?? price.ptr;
    const qty = Math.floor(c.qty);
    lines.push({
      key: lineKey(c),
      brandId: found.brand.id,
      brandTitle: found.brand.title,
      skuId: found.sku.id,
      priceIdx: c.priceIdx,
      option: c.option,
      name: c.option ? `${found.sku.name} (${c.option})` : found.sku.name,
      mrp: price.mrp,
      unit,
      qty,
      freeQty: 0,
      amount: round2(unit * qty),
      discount: 0,
      lineTotal: round2(unit * qty),
      group: found.sku.group,
    });
  }

  const applied: AppliedScheme[] = [];
  const freeLines: FreeLine[] = [];
  const gifts: { brandId: string; text: string }[] = [];
  const hints: { brandId: string; text: string }[] = [];

  for (const brand of sheet.brands) {
    const brandLines = lines.filter((l) => l.brandId === brand.id);
    if (brandLines.length === 0) continue;
    for (const rule of brand.rules) {
      if (rule.kind === "note") continue;
      applyRule(brand, rule, brandLines, applied, freeLines, gifts, hints);
    }
  }

  for (const f of freeLines) {
    if (f.skuId && !f.name) {
      const hit = findSku(sheet, f.skuId);
      if (hit) f.name = hit.sku.name;
    }
  }

  for (const l of lines) {
    l.discount = round2(l.discount);
    l.lineTotal = round2(l.amount - l.discount);
  }
  const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0));
  const discountTotal = round2(lines.reduce((s, l) => s + l.discount, 0));
  return {
    lines: lines.map((l) => {
      const { group, ...rest } = l;
      void group;
      return rest;
    }),
    applied,
    freeLines,
    gifts,
    hints,
    subtotal,
    discountTotal,
    total: round2(subtotal - discountTotal),
  };
}

function applyRule(
  brand: OtcBrand,
  rule: Scoped,
  brandLines: Work[],
  applied: AppliedScheme[],
  freeLines: FreeLine[],
  gifts: { brandId: string; text: string }[],
  hints: { brandId: string; text: string }[],
) {
  const scope = brandLines.filter((l) => !rule.skus || rule.skus.includes(l.skuId));
  if (scope.length === 0) return;
  const units = scope.reduce((s, l) => s + l.qty, 0);
  const value = scope.reduce((s, l) => s + l.amount, 0);

  switch (rule.kind) {
    case "qty_pct": {
      const tier = [...rule.tiers].filter((t) => units >= t.min).sort((a, b) => b.min - a.min)[0];
      if (tier) {
        let off = 0;
        for (const l of scope) {
          const d = round2((l.amount * tier.pct) / 100);
          l.discount += d;
          off += d;
        }
        applied.push({ brandId: brand.id, label: `${brand.title}: ${tier.pct}% scheme`, amount: round2(off) });
      }
      const next = [...rule.tiers].filter((t) => units < t.min).sort((a, b) => a.min - b.min)[0];
      if (next && next.min > 1) {
        hints.push({ brandId: brand.id, text: `${brand.title}: add ${next.min - units} more unit(s) for ${next.pct}% off` });
      }
      return;
    }
    case "value_slab": {
      const tier = [...rule.tiers].filter((t) => value >= t.min).sort((a, b) => b.min - a.min)[0];
      if (tier) {
        let off = 0;
        for (const l of scope) {
          const pct = tier.pctBy ? (l.group ? tier.pctBy[l.group] ?? 0 : 0) : (tier.pct ?? 0);
          if (!pct) continue;
          const d = round2((l.amount * pct) / 100);
          l.discount += d;
          off += d;
        }
        if (off > 0) {
          applied.push({ brandId: brand.id, label: `${brand.title}: slab ${inr(tier.min)}+ (${pctText(tier)})`, amount: round2(off) });
        }
        for (const f of tier.free ?? []) freeLines.push(freeSpecLine(brand.id, f, 1, `${brand.title}: slab ${inr(tier.min)}+`));
      }
      const next = [...rule.tiers].filter((t) => value < t.min).sort((a, b) => a.min - b.min)[0];
      if (next) {
        const bits = [
          next.pctBy || next.pct ? pctText(next) : "",
          ...(next.free ?? []).map((f) => `${f.qty} x ${f.name} free`),
        ].filter(Boolean);
        hints.push({ brandId: brand.id, text: `${brand.title}: add ${inr(next.min - value)} more to reach the ${inr(next.min)} slab (${bits.join(" + ")})` });
      }
      return;
    }
    case "free_tiers": {
      const groups = rule.per === "sku" ? scope.map((l) => [l]) : [scope];
      for (const group of groups) {
        const n = group.reduce((s, l) => s + l.qty, 0);
        const tier = [...rule.tiers].filter((t) => n >= t.min).sort((a, b) => b.min - a.min)[0];
        if (tier) {
          const free = rule.repeat ? Math.floor(n / tier.min) * tier.free : tier.free;
          if (rule.freeSkuId) {
            freeLines.push({ brandId: brand.id, skuId: rule.freeSkuId, priceIdx: 0, name: "", qty: free, label: `${brand.title}: buy ${tier.min}+ get ${tier.free} free` });
          } else {
            group[0].freeQty += free;
            applied.push({ brandId: brand.id, label: `${group[0].name}: ${free} free (buy ${tier.min}+ get ${tier.free})`, amount: 0 });
          }
        }
        const next = [...rule.tiers].filter((t) => n < t.min).sort((a, b) => a.min - b.min)[0];
        if (next) {
          hints.push({ brandId: brand.id, text: `${brand.title}${rule.per === "sku" ? ` (${group[0].name})` : ""}: add ${next.min - n} more unit(s) to get ${next.free} free` });
        }
      }
      return;
    }
    case "per_unit_off": {
      const tier = [...rule.tiers].filter((t) => units >= t.min).sort((a, b) => b.min - a.min)[0];
      if (tier) {
        let off = 0;
        for (const l of scope) {
          const d = round2(Math.min(tier.amount, l.unit) * l.qty);
          l.discount += d;
          off += d;
        }
        applied.push({ brandId: brand.id, label: `${brand.title}: ${inr(tier.amount)} off per unit (${tier.min}+ units)`, amount: round2(off) });
      }
      const next = [...rule.tiers].filter((t) => units < t.min).sort((a, b) => a.min - b.min)[0];
      if (next) {
        hints.push({ brandId: brand.id, text: `${brand.title}: add ${next.min - units} more unit(s) for ${inr(next.amount)} off per unit` });
      }
      return;
    }
    case "gift": {
      const have = rule.metric === "units" ? units : value;
      if (have >= rule.min) gifts.push({ brandId: brand.id, text: rule.gift });
      else {
        const gap = rule.metric === "units" ? `${rule.min - have} more unit(s)` : `${inr(rule.min - have)} more`;
        hints.push({ brandId: brand.id, text: `${brand.title}: add ${gap} to get ${rule.gift}` });
      }
      return;
    }
    case "buy_free_item": {
      // Counted per SKU, as the sheet says "any single SKU".
      let times = 0;
      for (const l of scope) times += Math.floor(l.qty / rule.buy);
      if (times > 0) freeLines.push(freeSpecLine(brand.id, rule.free, times, `${brand.title}: buy ${rule.buy} of one SKU`));
      return;
    }
  }
}
