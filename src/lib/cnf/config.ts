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
