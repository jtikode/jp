// One month's Cipla OTC rate sheet: brands, their SKUs with rates, and the
// schemes that go with them. Loaded from a typed file under ./sheets so a
// monthly update is a data change only; the engine below turns the rules into
// discounts and free units for whatever is in the cart.

export interface OtcPrice {
  /** Highest MRP when the sheet lists several batch MRPs for the same SKU. */
  mrp: number;
  /** Net PTR including GST, as printed on the sheet. */
  ptr: number;
  /** Rate after additional input already baked into the sheet's final rate
   *  (e.g. Prolyte "final rate"); billed at this instead of ptr when set. */
  net?: number;
  /** Shown instead of `mrp` when the sheet lists several batch MRPs. */
  mrpText?: string;
}

export interface OtcSku {
  id: string;
  name: string;
  /** One entry per MRP batch; cart lines pick one by index. */
  prices: OtcPrice[];
  /** Variants the retailer must choose (e.g. sizes). */
  options?: string[];
  /** Lets one rule treat gels and sprays differently inside a combined slab. */
  group?: string;
  note?: string;
}

export interface FreeItemSpec {
  /** Catalogue SKU to add at zero price; omit for a gift that is just noted. */
  skuId?: string;
  priceIdx?: number;
  name: string;
  qty: number;
}

export type OtcRule =
  | {
      /** % off the in-scope lines once total units reach a tier's minimum. */
      kind: "qty_pct";
      tiers: { min: number; pct: number }[];
      skus?: string[];
      text: string;
    }
  | {
      /** Per-invoice value slabs: % (optionally per SKU group) plus free items. */
      kind: "value_slab";
      tiers: { min: number; pct?: number; pctBy?: Record<string, number>; free?: FreeItemSpec[] }[];
      skus?: string[];
      text: string;
    }
  | {
      /** Buy N get M free of the same SKU (per SKU) or of the whole scope. */
      kind: "free_tiers";
      per: "sku" | "scope";
      tiers: { min: number; free: number }[];
      /** true: the best tier repeats for every full multiple of its minimum. */
      repeat?: boolean;
      skus?: string[];
      /** When the free units are a specific SKU (e.g. "only Cofsils Orange"). */
      freeSkuId?: string;
      text: string;
    }
  | {
      /** Flat rupee reduction per unit once units reach a tier. */
      kind: "per_unit_off";
      tiers: { min: number; amount: number }[];
      skus?: string[];
      text: string;
    }
  | {
      /** Gift once units or value reach `min`. */
      kind: "gift";
      metric: "units" | "value";
      min: number;
      skus?: string[];
      gift: string;
      text: string;
    }
  | {
      /** Buy N of one SKU, get a different item free (per full N). */
      kind: "buy_free_item";
      buy: number;
      skus?: string[];
      free: FreeItemSpec;
      text: string;
    }
  | { kind: "note"; text: string };

export interface OtcBrand {
  id: string;
  title: string;
  tag?: "NEW" | "NEW PRICE";
  skus: OtcSku[];
  rules: OtcRule[];
}

export interface OtcSheet {
  id: string;
  /** e.g. "October 2026" */
  label: string;
  /** Short line for the top of the portal. */
  banner: string;
  brands: OtcBrand[];
}

/** One cart line as the portal keeps it. */
export interface CartLine {
  skuId: string;
  priceIdx: number;
  option?: string;
  qty: number;
}
