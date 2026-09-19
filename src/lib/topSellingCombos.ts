// The fixed-dose combinations the Lowest Rate tab is limited to. Product
// compositions are free text ("telmisartan+amlodipine", "glimepiride (2mg) +
// metformin (500mg)", "paracetaol"), so matching is by salt set — order,
// strength notes and small spelling slips don't matter, but every salt in the
// combination must be present and nothing extra may be.

const SALT_ALIASES: Record<string, string[]> = {
  paracetamol: ["acetaminophen"],
  aspirin: ["acetylsalicylic acid"],
  hydrochlorothiazide: ["hctz", "hydrochlorthiazide"],
  cholecalciferol: ["vitamin d3", "vitamin d", "vit d3"],
  "clavulanic acid": ["potassium clavulanate", "clavulanate", "clavulanic"],
  "calcium carbonate": ["calcium"],
  sulfamethoxazole: ["sulphamethoxazole"],
  amoxicillin: ["amoxycillin"],
  glycopyrronium: ["glycopyrrolate"],
  salbutamol: ["albuterol"],
  isoniazid: ["inh"],
};

function normalizeSalt(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)?/g, " ")
    .replace(/[0-9.]+\s*(mg|mcg|ml|gm|g|iu|%)?/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = temp;
    }
  }
  return prev[b.length];
}

// Longer names tolerate a bigger slip; short ones must be exact. Kept tight
// enough that omeprazole never matches esomeprazole (a different salt).
function tolerance(name: string): number {
  if (name.length >= 12) return 2;
  if (name.length >= 6) return 1;
  return 0;
}

interface SaltMatcher {
  canonical: string;
  names: string[];
}

function saltMatcher(canonical: string): SaltMatcher {
  const key = normalizeSalt(canonical);
  return { canonical: key, names: [key, ...(SALT_ALIASES[canonical] ?? []).map(normalizeSalt)] };
}

function tokenMatchesSalt(token: string, salt: SaltMatcher): boolean {
  return salt.names.some((name, index) => {
    if (token === name || levenshtein(token, name) <= tolerance(name)) return true;
    // "metformin hydrochloride", "atorvastatin calcium", "telmisartan ip",
    // a salt-form suffix on the canonical name only (never on an alias, or
    // "calcium citrate" would pass as "calcium carbonate").
    return index === 0 && token.startsWith(name + " ");
  });
}

export interface TopCombo {
  label: string;
  salts: SaltMatcher[];
}

function combo(definition: string, label?: string): TopCombo {
  const names = definition.split("+").map((s) => s.trim());
  return {
    label: label ?? names.map((n) => n.replace(/\b\w/g, (c) => c.toUpperCase())).join(" + "),
    salts: names.map(saltMatcher),
  };
}

export const TOP_SELLING_COMBOS: TopCombo[] = [
  // Cardiovascular & hypertension
  combo("amlodipine + telmisartan"),
  combo("amlodipine + losartan"),
  combo("ramipril + hydrochlorothiazide"),
  combo("lisinopril + hydrochlorothiazide"),
  combo("losartan + hydrochlorothiazide"),
  combo("telmisartan + hydrochlorothiazide"),
  combo("bisoprolol + hydrochlorothiazide"),
  combo("amlodipine + atenolol"),
  combo("nebivolol + amlodipine"),
  combo("olmesartan + amlodipine + hydrochlorothiazide"),
  // Lipid-lowering & heart protection
  combo("atorvastatin + ezetimibe"),
  combo("rosuvastatin + ezetimibe"),
  combo("rosuvastatin + aspirin"),
  combo("atorvastatin + aspirin"),
  combo("atorvastatin + fenofibrate"),
  // Antidiabetic
  combo("metformin + glimepiride"),
  combo("metformin + gliclazide"),
  combo("metformin + sitagliptin"),
  combo("metformin + vildagliptin"),
  combo("metformin + linagliptin"),
  combo("metformin + empagliflozin"),
  combo("metformin + dapagliflozin"),
  combo("glimepiride + pioglitazone + metformin"),
  // Respiratory & anti-allergy
  combo("budesonide + formoterol"),
  combo("fluticasone + salmeterol"),
  combo("formoterol + glycopyrronium + budesonide"),
  combo("salbutamol + ipratropium bromide"),
  combo("montelukast + levocetirizine"),
  combo("montelukast + fexofenadine"),
  // Pain relief & anti-inflammatory
  combo("ibuprofen + paracetamol", "Ibuprofen + Paracetamol"),
  combo("aceclofenac + paracetamol"),
  combo("diclofenac + paracetamol"),
  combo("tramadol + paracetamol"),
  combo("aceclofenac + paracetamol + chlorzoxazone"),
  combo(
    "trypsin + chymotrypsin + aceclofenac + paracetamol",
    "Trypsin-Chymotrypsin + Aceclofenac + Paracetamol",
  ),
  // Gastroenterology
  combo("pantoprazole + domperidone"),
  combo("omeprazole + domperidone"),
  combo("rabeprazole + domperidone"),
  combo("ranitidine + domperidone"),
  combo("magaldrate + simethicone"),
  // Anti-infectives & antivirals
  combo("amoxicillin + clavulanic acid"),
  combo("sulfamethoxazole + trimethoprim"),
  combo("cefixime + azithromycin"),
  combo("artemether + lumefantrine"),
  combo("rifampicin + isoniazid + pyrazinamide + ethambutol"),
  combo("tenofovir + emtricitabine"),
  combo("efavirenz + emtricitabine + tenofovir"),
  combo("sofosbuvir + velpatasvir"),
  // Neurology & nutritional
  combo("levodopa + carbidopa"),
  combo("calcium carbonate + cholecalciferol", "Calcium Carbonate + Vitamin D3"),
];

// Sulfamethoxazole + trimethoprim is also stocked under its one-word name.
const SINGLE_TOKEN_ALIASES = new Map<string, string>([["co trimoxazole", "Sulfamethoxazole + Trimethoprim"], ["cotrimoxazole", "Sulfamethoxazole + Trimethoprim"]]);

const cache = new Map<string, TopCombo | null>();

/** Which top-selling combination (if any) this composition string is. */
export function matchTopCombo(composition: string): TopCombo | null {
  const cached = cache.get(composition);
  if (cached !== undefined) return cached;

  const tokens = [...new Set(composition.split("+").map(normalizeSalt).filter(Boolean))];

  let result: TopCombo | null = null;
  if (tokens.length === 1 && SINGLE_TOKEN_ALIASES.has(tokens[0])) {
    const label = SINGLE_TOKEN_ALIASES.get(tokens[0])!;
    result = TOP_SELLING_COMBOS.find((c) => c.label === label) ?? null;
  } else {
    result =
      TOP_SELLING_COMBOS.find((c) => {
        if (c.salts.length !== tokens.length) return false;
        const used = new Set<number>();
        return c.salts.every((salt) => {
          const idx = tokens.findIndex((tok, i) => !used.has(i) && tokenMatchesSalt(tok, salt));
          if (idx === -1) return false;
          used.add(idx);
          return true;
        });
      }) ?? null;
  }

  cache.set(composition, result);
  return result;
}
