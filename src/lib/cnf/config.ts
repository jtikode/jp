// cnf.jpkop.in: the ordering portal for distributors. It sells four ranges only,
// each made up of one or more company names as the billing software spells them.

export const CNF_BUSINESS_CODE = "jptraders";

export interface CnfGroup {
  slug: string;
  label: string;
  companies: string[];
}

export const CNF_GROUPS: readonly CnfGroup[] = [
  { slug: "dkt", label: "DKT", companies: ["DKT INDIA"] },
  { slug: "morepen-devices", label: "Morepen Devices", companies: ["MOREPEN DEVICES", "MOREPEN"] },
  { slug: "morepen-burnol", label: "Morepen Burnol", companies: ["MOREPEN BURNOL"] },
  { slug: "ambitech", label: "Ambitech", companies: ["AMBITECH", "AMBITECH REHAB"] },
];

export const CNF_COMPANIES: readonly string[] = CNF_GROUPS.flatMap((g) => g.companies);

export function cnfGroupOf(company: string | null | undefined): CnfGroup | null {
  if (!company) return null;
  const c = company.trim().toUpperCase();
  return CNF_GROUPS.find((g) => g.companies.includes(c)) ?? null;
}

// Smallest order total (in rupees) a distributor can place. 0 means no minimum;
// set it to the agreed amount to turn the rule on in the cart and on the server.
export const CNF_MIN_ORDER_VALUE = 0;

export const CNF_NOTE_PREFIX = "CNF PORTAL (distributor order)";

/** Percentages the admin can give a distributor: purchase rate plus this much. */
export const CNF_MAX_PERCENT = 100;
