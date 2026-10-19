import { COMPANY_TILES, TILE_RULES } from "@/lib/categoryTileRules";
import type { Lang } from "@/lib/i18n";

// "Shop by category" tiles (cough syrup, antifungal ointment…). Most catalogue
// products have no category or salt filled in, so each product is sorted into a
// tile automatically from what we do have: the billing-sheet Category, the
// company, the name and the salt. Pure functions, no I/O, so the same code runs
// on the server (search index) and on the phone (offline catalogue).

export interface CategoryTile {
  slug: string;
  /** Name used by the rules in categoryTileRules.ts. */
  rule: string;
  en: string;
  mr: string;
}

// Shown in this order (what retailers buy most comes first).
export const CATEGORY_TILES: CategoryTile[] = [
  { slug: "gut-care", rule: "Gut Care", en: "Gut Care", mr: "पोटाची निगा" },
  { slug: "fever-pain", rule: "Fever & Pain Relief", en: "Fever & Pain Relief", mr: "ताप व वेदना" },
  { slug: "cough-cold", rule: "Cough & Cold", en: "Cough & Cold", mr: "सर्दी-खोकला" },
  { slug: "devices", rule: "Devices & Diagnostics", en: "Devices & Diagnostics", mr: "उपकरणे व तपासणी" },
  { slug: "pain-gels", rule: "Pain Gels, Sprays & Balms", en: "Pain Gels, Sprays & Balms", mr: "पेन जेल, स्प्रे व बाम" },
  { slug: "surgical", rule: "Surgical & First Aid", en: "Surgical & First Aid", mr: "सर्जिकल व प्रथमोपचार" },
  { slug: "antifungal", rule: "Antifungal & Skin Infection", en: "Antifungal & Skin Infection", mr: "बुरशी व त्वचा संसर्ग" },
  { slug: "antibiotics", rule: "Antibiotics & Infection", en: "Antibiotics & Infection", mr: "अँटिबायोटिक्स" },
  { slug: "ors", rule: "ORS & Rehydration", en: "ORS & Rehydration", mr: "ORS व डिहायड्रेशन" },
  { slug: "skin-care", rule: "Skin Care & Derma", en: "Skin Care & Derma", mr: "त्वचा काळजी" },
  { slug: "oral-dental", rule: "Oral & Dental Care", en: "Oral & Dental Care", mr: "तोंड व दात" },
  { slug: "vitamins", rule: "Vitamins & Supplements", en: "Vitamins & Supplements", mr: "जीवनसत्त्वे व सप्लिमेंट्स" },
  { slug: "heart-bp", rule: "Heart, BP & Cholesterol", en: "Heart, BP & Cholesterol", mr: "हृदय, BP व कोलेस्टेरॉल" },
  { slug: "allergy-asthma", rule: "Allergy & Asthma", en: "Allergy & Asthma", mr: "अॅलर्जी व दमा" },
  { slug: "diabetes", rule: "Diabetes Care", en: "Diabetes Care", mr: "मधुमेह" },
  { slug: "eye-ear", rule: "Eye & Ear Care", en: "Eye & Ear Care", mr: "डोळे व कान" },
  { slug: "sexual-wellness", rule: "Sexual Wellness", en: "Sexual Wellness", mr: "लैंगिक आरोग्य" },
  { slug: "hair", rule: "Hair Care", en: "Hair Care", mr: "केसांची निगा" },
  { slug: "baby", rule: "Baby Care", en: "Baby Care", mr: "बाळाची निगा" },
  { slug: "brain-nerve", rule: "Brain, Nerve & Sleep", en: "Brain, Nerve & Sleep", mr: "मेंदू, नस व झोप" },
  { slug: "womens", rule: "Women's Health", en: "Women's Health", mr: "महिला आरोग्य" },
  { slug: "urology", rule: "Urology & Kidney", en: "Urology & Kidney", mr: "मूत्र व किडनी" },
  { slug: "worms", rule: "Worms & Parasites", en: "Worms & Parasites", mr: "जंत व परजीवी" },
  { slug: "thyroid", rule: "Thyroid & Hormones", en: "Thyroid & Hormones", mr: "थायरॉईड व हार्मोन्स" },
  { slug: "ayurvedic", rule: "Ayurvedic & Herbal", en: "Ayurvedic & Herbal", mr: "आयुर्वेदिक" },
  { slug: "supports", rule: "Supports & Braces", en: "Supports & Braces", mr: "सपोर्ट व बेल्ट" },
  { slug: "quit-smoking", rule: "Quit Smoking & OTC Wellness", en: "Quit Smoking & OTC", mr: "धूम्रपान सोडा" },
  { slug: "home-personal", rule: "Home & Personal", en: "Home & Personal", mr: "घर व वैयक्तिक" },
  { slug: "other-medicines", rule: "Other medicines (salt not listed)", en: "Other Medicines", mr: "इतर औषधे" },
];

const SLUG_BY_RULE = new Map(CATEGORY_TILES.map((c) => [c.rule, c.slug]));
const TILE_BY_SLUG = new Map(CATEGORY_TILES.map((c) => [c.slug, c]));

export function getCategoryTile(slug: string | undefined | null): CategoryTile | undefined {
  return slug ? TILE_BY_SLUG.get(slug) : undefined;
}

export function tileName(tile: CategoryTile, lang: Lang): string {
  return lang === "mr" ? tile.mr : tile.en;
}

export interface TileClassifiable {
  name: string;
  company: string | null;
  composition: string | null;
  category: string | null;
}

const RULE_BY_NAME = new Map(TILE_RULES.map((r) => [r.tile, r]));
const EXACT_CATEGORY = new Map<string, string>();
for (const r of TILE_RULES) for (const c of r.cats) EXACT_CATEGORY.set(c, r.tile);

// Non-drug lines are recognised by name before any salt is looked at.
const NAME_FIRST = [
  "Devices & Diagnostics", "Supports & Braces", "Surgical & First Aid", "Sexual Wellness", "Home & Personal",
  "Baby Care", "Oral & Dental Care", "Eye & Ear Care", "ORS & Rehydration", "Hair Care", "Quit Smoking & OTC Wellness",
];
// Then drugs by salt, most specific tiles first.
const SALT_ORDER = [
  "Pain Gels, Sprays & Balms", "Antifungal & Skin Infection", "Skin Care & Derma", "Cough & Cold", "Allergy & Asthma",
  "Diabetes Care", "Heart, BP & Cholesterol", "Thyroid & Hormones", "Brain, Nerve & Sleep", "Antibiotics & Infection",
  "Worms & Parasites", "Gut Care", "Women's Health", "Urology & Kidney", "Fever & Pain Relief", "Vitamins & Supplements",
  "Ayurvedic & Herbal", "Eye & Ear Care",
];
// Last resort for products with no salt listed: look at the name alone.
const NAME_LAST = [
  "Cough & Cold", "Fever & Pain Relief", "Pain Gels, Sprays & Balms", "Skin Care & Derma", "Vitamins & Supplements",
  "Gut Care", "Ayurvedic & Herbal", "Antibiotics & Infection", "Women's Health", "Urology & Kidney",
];
const TOPICAL_WORDS = [" GEL", " SPRAY", " OINT", " CREAM", " LOTION", " CRM", " POWDER", " SOAP", " SHAMPOO"];
const DOSAGE_WORDS = [" TAB", " CAP", " SYP", " SYRUP", " SUSP", " DROPS", " INJ", "TABLETS", "CAPSULES", "SUSPENSION", " SACHET", "TABLET"];
const NO_SALT = new Set(["OTHERS", "-BLANK-", "(BLANK)"]);

const cache = new WeakMap<object, string | null>();

/** Tile slug for a product, or null when nothing in the catalogue data points anywhere. */
export function classifyTile(p: TileClassifiable): string | null {
  const hit = cache.get(p);
  if (hit !== undefined) return hit;
  const slug = classify(p);
  cache.set(p, slug);
  return slug;
}

function classify(p: TileClassifiable): string | null {
  const nm = ` ${(p.name ?? "").toUpperCase().replace(/\s+/g, " ")} `;
  const comp = (p.composition ?? "").toUpperCase();
  const cat = (p.category ?? "").trim().toUpperCase();
  const slugOf = (rule: string) => SLUG_BY_RULE.get(rule) ?? null;
  const nameHas = (rule: string) => RULE_BY_NAME.get(rule)?.kw.some((k) => nm.includes(k)) ?? false;

  const exact = EXACT_CATEGORY.get(cat);
  if (exact) return slugOf(exact);

  const co = (p.company ?? "").trim().toUpperCase();
  for (const [rule, companies] of Object.entries(COMPANY_TILES)) {
    if (companies.includes(co)) return slugOf(rule);
  }

  for (const rule of NAME_FIRST) if (nameHas(rule)) return slugOf(rule);

  if (comp && !NO_SALT.has(comp)) {
    const topical = TOPICAL_WORDS.some((w) => nm.includes(w));
    for (const rule of SALT_ORDER) {
      if ((rule === "Pain Gels, Sprays & Balms" || rule === "Skin Care & Derma") && !topical) continue;
      if (RULE_BY_NAME.get(rule)?.salts.some((s) => comp.includes(s))) return slugOf(rule);
    }
  }

  for (const rule of NAME_LAST) if (nameHas(rule)) return slugOf(rule);

  if (DOSAGE_WORDS.some((w) => nm.includes(w))) return slugOf("Other medicines (salt not listed)");
  return null;
}
