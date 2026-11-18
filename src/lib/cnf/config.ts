// cnf.jpkop.in: the ordering portal for distributors. It sells these ranges only,
// each made up of one or more company names as the billing software spells them.

export const CNF_BUSINESS_CODE = "jptraders";

export interface CnfGroup {
  slug: string;
  label: string;
  companies: string[];
  /** Products picked by name when their company is not one of the portal ranges (Omee sits under Alkem). */
  namePattern?: RegExp;
  /** Overstocked products of any company (see CNF_OVERSTOCK_QTY / CNF_OVERSTOCK_VALUE). */
  overstock?: boolean;
  /** Fixed percentage over the purchase rate. Left out, the distributor's own percentage applies. */
  fixedPercent?: number;
}

export const CNF_GROUPS: readonly CnfGroup[] = [
  { slug: "dkt", label: "DKT", companies: ["DKT INDIA"] },
  { slug: "morepen-devices", label: "Morepen Devices", companies: ["MOREPEN DEVICES", "MOREPEN"], fixedPercent: 10 },
  { slug: "morepen-burnol", label: "Morepen Burnol", companies: ["MOREPEN BURNOL"], fixedPercent: 7 },
  { slug: "ambitech", label: "Ambitech", companies: ["AMBITECH", "AMBITECH REHAB"], fixedPercent: 10 },
  { slug: "cipla-otc", label: "Cipla OTC", companies: ["CIPLA OTC"], fixedPercent: 0 },
  { slug: "omee", label: "Omee", companies: [], namePattern: /^OMEE\b/i, fixedPercent: 0 },
  // Overstock of any other company, so it moves. No fixed percentage: the distributor's own one applies.
  { slug: "more", label: "More products", companies: [], overstock: true },
];

/**
 * A product joins "More products" while it is overstocked: more than this many units on the shelf,
 * or stock value (units x purchase rate) above this many rupees. It leaves again when stock falls.
 */
export const CNF_OVERSTOCK_QTY = 500;
export const CNF_OVERSTOCK_VALUE = 10000;

/** Billing-software company text made readable: "SMW WELLNESS" -> "SMW Wellness". Short words stay as they are. */
export function cnfCompanyLabel(company: string): string {
  return company
    .trim()
    .split(/\s+/)
    .map((w) => (w.length <= 3 ? w : w.charAt(0) + w.slice(1).toLowerCase()))
    .join(" ");
}

/** Overstock is shown one block per company, so each gets its own group slug. */
export function cnfCompanySlug(company: string | null | undefined): string {
  const s = (company ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `more-${s || "other"}`;
}

export interface CnfGroupTab {
  slug: string;
  label: string;
  count: number;
}

/**
 * The blocks and filter chips: the fixed ranges first (always shown), then one block for every other
 * company that has products in the catalog, A to Z.
 */
export function cnfGroupTabs(products: readonly { group: string; groupLabel: string }[]): CnfGroupTab[] {
  const seen = new Map<string, { label: string; count: number }>();
  for (const p of products) {
    const e = seen.get(p.group);
    if (e) e.count += 1;
    else seen.set(p.group, { label: p.groupLabel, count: 1 });
  }
  const fixed = CNF_GROUPS.filter((g) => !g.overstock).map((g) => ({ slug: g.slug, label: g.label, count: seen.get(g.slug)?.count ?? 0 }));
  const fixedSlugs = new Set(fixed.map((g) => g.slug));
  const rest = [...seen]
    .filter(([slug]) => !fixedSlugs.has(slug))
    .map(([slug, v]) => ({ slug, label: v.label, count: v.count }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return [...fixed, ...rest];
}

export const CNF_COMPANIES: readonly string[] = CNF_GROUPS.flatMap((g) => g.companies);

export function cnfGroupOf(company: string | null | undefined, name?: string | null, overstocked = false): CnfGroup | null {
  const n = (name ?? "").trim();
  const byName = n ? CNF_GROUPS.find((g) => g.namePattern?.test(n)) : undefined;
  if (byName) return byName;
  if (company) {
    const c = company.trim().toUpperCase();
    const byCompany = CNF_GROUPS.find((g) => g.companies.includes(c));
    if (byCompany) return byCompany;
  }
  // Last: overstock, so a company range always wins over "More products".
  return overstocked ? CNF_GROUPS.find((g) => g.overstock) ?? null : null;
}

// Smallest order total (in rupees) a distributor can place. 0 means no minimum;
// set it to the agreed amount to turn the rule on in the cart and on the server.
export const CNF_MIN_ORDER_VALUE = 5000;

export const CNF_NOTE_PREFIX = "CNF PORTAL (distributor order)";

/** Percentages the admin can give a distributor: purchase rate plus this much. */
export const CNF_MAX_PERCENT = 100;
