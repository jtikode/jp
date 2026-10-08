import type { OtcBrand, OtcPrice, OtcSheet } from "../types";

// Cipla OTC "West 1" rate sheet, October 2026. Rates are Net PTR including GST
// as printed. Where the sheet lists several MRP batches for one SKU, each batch
// is its own price entry. Percent schemes on the sheet apply to PTR excluding
// tax, which comes to the same percentage off a GST-inclusive amount.

const p = (mrp: number, ptr: number, net?: number): OtcPrice => (net === undefined ? { mrp, ptr } : { mrp, ptr, net });
const batch = (mrps: number[], ptr: number): OtcPrice => ({
  mrp: Math.max(...mrps),
  ptr,
  mrpText: mrps.join(" / "),
});

const SIZES = ["M", "L", "XL", "XXL"];

const brands: OtcBrand[] = [
  {
    id: "omnigel",
    title: "Omnigel (Gel, Spray, Max Strong, Extensions)",
    skus: [
      { id: "og-gel-10", name: "Omnigel Gel 10gm", group: "gel", prices: [p(61.21, 32.43), p(67.34, 33.39)] },
      { id: "og-gel-15", name: "Omnigel Gel 15gm", group: "gel", prices: [p(79.68, 42.46), p(87.65, 43.31)] },
      { id: "og-gel-20", name: "Omnigel Gel 20gm", group: "gel", prices: [p(107.34, 54.07), p(118.03, 55.69)] },
      { id: "og-gel-30", name: "Omnigel Gel 30gm", group: "gel", prices: [p(124.78, 63.7), p(137.25, 64.99), p(150.97, 66.94)], note: "30g TO stock gets 2% input only." },
      { id: "og-gel-50", name: "Omnigel Gel 50gm", group: "gel", prices: [p(184.68, 96.9), p(203.12, 100.78)] },
      { id: "og-gel-75", name: "Omnigel Gel 75gm", group: "gel", prices: [p(262.03, 138.42), p(288.23, 143.95)] },
      { id: "og-gel-100", name: "Omnigel Gel 100gm", group: "gel", prices: [p(268.12, 156.94), p(294.93, 163.22)] },
      { id: "og-spray-20", name: "Omnigel Spray 20gm", group: "spray", prices: [p(103.56, 64.95), p(113.91, 67.54)] },
      { id: "og-spray-35", name: "Omnigel Spray 35gm", group: "spray", prices: [p(135.37, 86.01), p(148.91, 89.45)] },
      { id: "og-spray-55", name: "Omnigel Spray 55gm", group: "spray", prices: [p(204.18, 109.13), p(224.6, 111.34), p(247.05, 115.8)] },
      { id: "og-spray-75", name: "Omnigel Spray 75gm", group: "spray", prices: [p(255.84, 135.64), p(281.37, 141.06)] },
      { id: "og-spray-100", name: "Omnigel Spray 100gm", group: "spray", prices: [p(305.14, 175.38), p(335.65, 182.39)] },
      { id: "ogm-gel-30", name: "Omnigel Max Strong Gel 30g", group: "gel", prices: [p(167, 66.95)] },
      { id: "ogm-spray-35", name: "Omnigel Max Strong Spray 35g", group: "spray", prices: [p(154.7, 89.45)] },
      { id: "ogm-spray-55", name: "Omnigel Max Strong Spray 55g", group: "spray", prices: [p(267.6, 115.79)] },
      { id: "ogm-spray-75", name: "Omnigel Max Strong Spray 75g", group: "spray", prices: [p(287, 141.06)] },
      { id: "ogm-spray-100", name: "Omnigel Max Strong Spray 100g", group: "spray", prices: [p(340.3, 182.41)] },
      { id: "omni-ortho-oil", name: "Omni Ortho Oil", group: "ext", prices: [p(276.56, 182.53)] },
      { id: "omnibalm", name: "Omnibalm", group: "ext", prices: [p(37.5, 25)] },
      { id: "omnigel-active-rollon", name: "Omnigel Active Roll-On", group: "rollon", prices: [p(93.75, 72.23)] },
      { id: "omnigel-active-sachet", name: "Omnigel Active (sachet)", group: "rollon", prices: [p(9.37, 6.75)] },
    ],
    rules: [
      {
        kind: "value_slab",
        // Per-invoice slabs counted on gel + spray (and the Omni extensions) together; capped at Rs 10,000 per invoice and settled through claims.
        skus: [
          "og-gel-10", "og-gel-15", "og-gel-20", "og-gel-30", "og-gel-50", "og-gel-75", "og-gel-100",
          "og-spray-20", "og-spray-35", "og-spray-55", "og-spray-75", "og-spray-100",
          "ogm-gel-30", "ogm-spray-35", "ogm-spray-55", "ogm-spray-75", "ogm-spray-100",
          "omni-ortho-oil", "omnibalm",
        ],
        tiers: [
          { min: 500, pctBy: { gel: 4, spray: 6, ext: 4 }, free: [{ name: "Omnigel LUP", qty: 12 }] },
          {
            min: 2500,
            pctBy: { gel: 4, spray: 6, ext: 4 },
            free: [{ skuId: "og-spray-75", priceIdx: 1, name: "Omnigel Spray 75gm", qty: 2 }],
          },
        ],
        text: "Per-invoice slabs (Gel + Spray combined): ≥₹500: Gel 4% / Spray 6% + 12 units of Omnigel LUP free. ≥₹2500: Gel 4% / Spray 6% + 2 units of Omnigel Spray 75gm free. Counted in a single invoice, capped at ₹10,000 per invoice, settled through claims.",
      },
      { kind: "free_tiers", per: "sku", tiers: [{ min: 3, free: 1 }], repeat: true, skus: ["omnigel-active-rollon"], text: "Omnigel Active Roll-On: buy 3 get 1 free." },
      { kind: "note", text: "Omni Portfolio 4% applies to everything except Active and Roll-On." },
    ],
  },
  {
    id: "omnigel-actismart",
    title: "Omnigel Actismart (supports and braces)",
    skus: [
      { id: "as-collar", name: "Cervical Collar Soft", options: SIZES, prices: [p(442, 176.8)] },
      { id: "as-lumbo", name: "Lumbo Sacral Belt", options: SIZES, prices: [p(1100, 440)] },
      { id: "as-knee-milange", name: "Knee Cap Milange", options: SIZES, prices: [p(425, 170)] },
      { id: "as-knee-patella", name: "Knee Cap with Open Patella", options: SIZES, prices: [p(520, 208)] },
      { id: "as-comp-above", name: "Compression Stockings Above Knee", options: SIZES, prices: [p(1321, 528.4)] },
      { id: "as-comp-below", name: "Compression Stockings Below Knee", options: SIZES, prices: [p(952, 380.8)] },
      { id: "as-knee-hinge", name: "Knee Cap with Hinge", options: SIZES, prices: [p(800, 320)] },
      { id: "as-abdominal", name: "Abdominal Belt", options: SIZES, prices: [p(938, 375.2)] },
      { id: "as-ankle-binder", name: "Ankle Binder", options: SIZES, prices: [p(344, 137.6)] },
      { id: "as-anklet", name: "Anklet", options: SIZES, prices: [p(340, 136)] },
    ],
    rules: [
      { kind: "value_slab", tiers: [{ min: 500, pct: 5 }], text: "5% additional on purchase of ₹500 or more." },
    ],
  },
  {
    id: "paracip-thermometer",
    title: "Paracip Digital Thermometer",
    skus: [{ id: "pt-1", name: "Paracip Thermometer", prices: [p(275, 76.99)] }],
    rules: [
      {
        kind: "free_tiers",
        per: "sku",
        tiers: [{ min: 9, free: 1 }, { min: 17, free: 3 }],
        text: "Buy 9 units get 1 free. Buy 17 units get 3 free.",
      },
      { kind: "note", text: "Primary scheme 65% is already in the rate." },
    ],
  },
  {
    id: "nicotex-fliptop-15",
    title: "Nicotex Fliptop Strips (15 gums)",
    tag: "NEW",
    skus: [
      { id: "nf15-2", name: "Nicotex Fliptop 15 gums 2mg", prices: [p(153.64, 122.9), p(154.61, 123.69)] },
      { id: "nf15-4", name: "Nicotex Fliptop 15 gums 4mg", prices: [p(190.25, 152.22), p(191.48, 153.18)] },
    ],
    rules: [{ kind: "qty_pct", tiers: [{ min: 18, pct: 5 }], text: "Secondary scheme 5% on purchase of 18 or more units." }],
  },
  {
    id: "nicotex-strips-12",
    title: "Nicotex Strips (12 gums)",
    skus: [
      { id: "ns12-2", name: "Nicotex Strips 12 gums 2mg", prices: [p(123.1, 98.48), p(123.89, 99.11)] },
      { id: "ns12-4", name: "Nicotex Strips 12 gums 4mg", prices: [p(152.61, 122.09), p(153.6, 122.88)] },
    ],
    rules: [{ kind: "qty_pct", tiers: [{ min: 18, pct: 5 }], text: "Secondary scheme 5% on purchase of 18 or more units." }],
  },
  {
    id: "nicotex-flavours-9",
    title: "Nicotex Flavours (9 gums)",
    skus: [
      { id: "nfl9-2", name: "Nicotex Strips 9 gums 2mg", prices: [p(92.58, 74.07), p(93.18, 74.54)] },
      { id: "nfl9-4", name: "Nicotex Strips 9 gums 4mg", prices: [p(113.94, 91.16), p(114.68, 91.75)] },
    ],
    rules: [{ kind: "note", text: "Primary scheme 33.33% on Nicotex Flavours (Ultra Mint and Fruit Burst), non-TO stocks only." }],
  },
  {
    id: "nicotex-pan-tins",
    title: "Nicotex Pan Tins (30 gums)",
    tag: "NEW",
    skus: [
      { id: "npt-2", name: "Nicotex Pan Tin 30 gums 2mg", prices: [p(300.09, 240.07)] },
      { id: "npt-4", name: "Nicotex Pan Tin 30 gums 4mg", prices: [p(368.63, 294.9)] },
    ],
    rules: [{ kind: "note", text: "Primary scheme 33.33% on Nicotex Pan Flavour." }],
  },
  {
    id: "nicotex-tins",
    title: "Nicotex Tins (Regular 30 gums and Big 44 gums)",
    tag: "NEW",
    skus: [
      { id: "nt30-2", name: "Nicotex Regular Tin 30 gums 2mg", prices: [p(298.09, 238.47), p(300.09, 240.07)] },
      { id: "nt30-4", name: "Nicotex Regular Tin 30 gums 4mg", prices: [p(366.26, 293.9), p(368.63, 294.9)] },
      { id: "nt44-2", name: "Nicotex Big Tin 44 gums 2mg", prices: [p(412.04, 324), p(414.71, 324)] },
      { id: "nt44-4", name: "Nicotex Big Tin 44 gums 4mg", prices: [p(492, 393.6)] },
    ],
    rules: [
      { kind: "qty_pct", tiers: [{ min: 9, pct: 5 }], skus: ["nt30-2", "nt30-4"], text: "Regular Tins: secondary scheme 5% on purchase of 9 or more tins." },
      { kind: "qty_pct", tiers: [{ min: 4, pct: 5 }], skus: ["nt44-2", "nt44-4"], text: "Big Tins: secondary scheme 5% on purchase of 4 or more tins." },
    ],
  },
  {
    id: "nicotex-patches",
    title: "Nicotex Patches",
    skus: [
      { id: "np-21", name: "Nicotex Patch 21mg (pack of 7)", prices: [p(825, 660)] },
      { id: "np-14", name: "Nicotex Patch 14mg (pack of 7)", prices: [p(699, 559.2)] },
      { id: "np-7", name: "Nicotex Patch 7mg (pack of 7)", prices: [p(599, 479.2)] },
    ],
    rules: [],
  },
  {
    id: "nicogum",
    title: "Nicogum 16's Strip",
    skus: [
      { id: "ng-2", name: "Nicogum 2mg (16 pieces)", prices: [p(164.13, 131.3)] },
      { id: "ng-4", name: "Nicogum 4mg (16 pieces)", prices: [p(203.48, 162.78)] },
    ],
    rules: [],
  },
  {
    id: "astaberry-hair-removal",
    title: "Astaberry Hair Removal",
    skus: [
      { id: "ab-sens-30", name: "Astaberry Sensitive Skin 30g", prices: [p(75, 36)] },
      { id: "ab-sens-50", name: "Astaberry Sensitive Skin 50g", prices: [p(120, 57.6)] },
      { id: "ab-norm-30", name: "Astaberry Normal Skin 30g", prices: [p(75, 36)] },
      { id: "ab-norm-50", name: "Astaberry Normal Skin 50g", prices: [p(120, 57.6)] },
      { id: "ab-wax", name: "Astaberry Wax Strips (8 nos)", prices: [p(120, 81.6)] },
    ],
    rules: [{ kind: "value_slab", tiers: [{ min: 300, pct: 5 }], text: "5% secondary scheme on purchase of ₹300 or more." }],
  },
  {
    id: "cofsils-lozenges",
    title: "Cofsils Lozenges (jars of strips)",
    tag: "NEW PRICE",
    skus: [
      { id: "cl-orange-39", name: "Cofsils Orange / Ginger Lemon / LH Lozenges (MRP 39)", prices: [p(39, 26)] },
      { id: "cl-orange-3562", name: "Cofsils Orange / Ginger Lemon / LH Lozenges (MRP 35.62)", prices: [p(35.62, 23.75)] },
      { id: "cl-herbal", name: "Cofsils Tulsi Pudina / Fresh Mint / Muleti Lozenges", prices: [p(35.62, 23.75, 21.37)], note: "Rate includes the 10% additional scheme." },
    ],
    rules: [
      {
        kind: "free_tiers",
        per: "scope",
        tiers: [{ min: 53, free: 3 }, { min: 166, free: 10 }, { min: 332, free: 22 }],
        freeSkuId: "cl-orange-3562",
        text: "Placement incentive on billed strips: 2 jars (53+ strips) get 3 free strips; 6 jars (166+) get 10 free; 12 jars (332+) get 22 free. Free strips are Cofsils Orange only.",
      },
      { kind: "note", text: "Cofsils Orange / GL pouch carries an additional 10% discount. 12 strips in a jar." },
    ],
  },
  {
    id: "cofsils-cough-drops",
    title: "Cofsils Cough Drops",
    skus: [
      { id: "cd-210", name: "Cofsils Cough Drops 210 Jar (205 billed + 5 free)", prices: [p(200, 119.97)] },
      { id: "cd-1300", name: "Cofsils Cough Drops 1300 Jar (1200 billed + 100 free)", prices: [p(1200, 714.24), p(1200, 768)] },
    ],
    rules: [],
  },
  {
    id: "cofsils-cough-syrup",
    title: "Cofsils Cough Syrup (100ml)",
    tag: "NEW PRICE",
    skus: [
      { id: "cs-medicated", name: "Cofsils Medicated Syrup 100ml", prices: [p(101.25, 22.39)], note: "MRP 92.81 / 101.25" },
      { id: "cs-natural", name: "Cofsils Natural Syrup 100ml", prices: [p(84.37, 41.22)] },
      { id: "cs-wet", name: "Cofsils Wet Syrup 100ml", prices: [p(106.87, 27.81)], note: "MRP 97.50 / 106.87" },
      { id: "cs-dry", name: "Cofsils Dry Syrup 100ml", prices: [p(106.87, 27.81)], note: "MRP 97.50 / 106.87" },
      { id: "cs-dx", name: "Cofsils Dx Syrup 100ml", prices: [p(123.75, 37.25)], note: "MRP 112.50 / 123.75" },
      { id: "cs-ls", name: "Cofsils LS Syrup 100ml", prices: [p(107.81, 34.19)], note: "MRP 98.43 / 107.81" },
    ],
    rules: [
      { kind: "per_unit_off", tiers: [{ min: 30, amount: 2 }], text: "Additional input ₹2 per unit on 30 or more units." },
      { kind: "gift", metric: "units", min: 60, gift: "Cofsils Bag", text: "Cofsils Bag on purchase of 60 units." },
      { kind: "gift", metric: "units", min: 120, gift: "Pepe Jeans Duffel Bag (MRP ₹2499) for the outlet", text: "Pepe Jeans branded Duffel Bag (MRP ₹2499) for each outlet on purchase of 120 units." },
    ],
  },
  {
    id: "cofsils-gargle",
    title: "Cofsils Gargle",
    skus: [
      { id: "cg-100", name: "Cofsils Gargle 100ml", prices: [p(159.37, 59.71)] },
      { id: "cg-50", name: "Cofsils Gargle 50ml", prices: [p(103.12, 38.64)] },
    ],
    rules: [],
  },
  {
    id: "prolyte-ors-liquid",
    title: "Prolyte ORS Liquid 200ml",
    skus: [
      {
        id: "pl-200",
        name: "Prolyte ORS Liquid 200ml",
        prices: [p(31.5, 17.37, 13.97), p(32.04, 17.67, 14.27), p(32.24, 17.78, 14.38)],
        note: "Rate shown is after the ₹3.40 additional input.",
      },
    ],
    rules: [],
  },
  {
    id: "prolyte-electroshot",
    title: "Prolyte ElectroShot",
    tag: "NEW",
    skus: [{ id: "pe-1", name: "Prolyte ElectroShot", prices: [p(40, 22.41, 20.02)], note: "Final rate after ₹2.39 additional input." }],
    rules: [],
  },
  {
    id: "prolyte-ors-125",
    title: "Prolyte ORS 125ml",
    tag: "NEW",
    skus: [{ id: "p125-1", name: "Prolyte ORS 125ml (Apple, Orange, Mixed Fruit, Nimbu Paani)", prices: [p(20, 14.67, 13.18)], note: "Final rate after ₹1.49 additional input." }],
    rules: [],
  },
  {
    id: "prolyte-ors-powder",
    title: "Prolyte ORS Powder",
    skus: [
      { id: "pp-nimbu", name: "Prolyte Nimbu Pani Powder 22.4g", prices: [p(23.75, 8.22, 7.02), p(23.98, 8.3, 7.1)] },
      { id: "pp-tangy", name: "Prolyte Tangy Orange Powder 22.2g", prices: [p(23.54, 8.22, 7.02), p(23.77, 8.3, 7.1)] },
      { id: "pp-orange-21", name: "Prolyte Orange Powder 21g", prices: [p(22.26, 8.22, 7.02), p(22.4, 8.3, 7.1)] },
      { id: "pp-orange-42", name: "Prolyte Orange Powder 4.2g", prices: [p(4.45, 3.52), p(4.49, 3.56)] },
    ],
    rules: [{ kind: "note", text: "Net rate shown is after the ₹1.38 QPS on the 21g to 22.4g packs." }],
  },
  {
    id: "unfold",
    title: "Unfold Condoms",
    skus: [
      { id: "un-ds-3", name: "Unfold Dotted Strawberry (3s)", prices: [p(30, 14.4)] },
      { id: "un-dc-3", name: "Unfold Dotted Chocolate (3s)", prices: [p(30, 14.4)] },
      { id: "un-et-3", name: "Unfold Extended Time (3s)", prices: [p(40, 19.2)] },
      { id: "un-vt-3", name: "Unfold Very Thin (3s)", prices: [p(50, 24)] },
      { id: "un-ds-10", name: "Unfold Dotted Strawberry (10s)", prices: [p(90, 43.2)] },
      { id: "un-dc-10", name: "Unfold Dotted Chocolate (10s)", prices: [p(90, 43.2)] },
      { id: "un-et-10", name: "Unfold Extended Time (10s)", prices: [p(120, 57.6)] },
      { id: "un-vt-10", name: "Unfold Very Thin (10s)", prices: [p(150, 72)] },
    ],
    rules: [
      {
        kind: "value_slab",
        tiers: [{ min: 600, pct: 9 }, { min: 1200, pct: 11 }, { min: 2400, pct: 13 }, { min: 5000, pct: 15 }],
        text: "Additional QPS by value slab: ₹600: 9%, ₹1200: 11%, ₹2400: 13%, ₹5000: 15%.",
      },
      { kind: "gift", metric: "value", min: 7000, gift: "Nautica Bag", text: "On purchase of ₹7000 get a Nautica Bag." },
      { kind: "note", text: "3+2 scheme is already in the rate." },
    ],
  },
  {
    id: "paracip-portfolio",
    title: "Paracip Portfolio",
    skus: [
      { id: "pc-500", name: "Paracip-500 Tablets", prices: [batch([9.33, 9.45, 9.65, 10.39], 7.09)] },
      { id: "pc-650", name: "Paracip-650 Tablets", prices: [batch([18.78, 21.0, 21.1, 21.41], 10.75)] },
      { id: "pc-susp", name: "Paracip Suspension 60ml (250mg)", prices: [batch([41.57, 42.2, 42.83], 18.36)] },
      { id: "pc-syrup", name: "Paracip Syrup 60ml (125mg)", prices: [batch([23.3, 23.36, 23.93], 17.32)] },
      { id: "pc-drops", name: "Paracip Drops 15ml (150mg)", prices: [batch([34.85, 37.5], 21.92)] },
    ],
    rules: [
      { kind: "qty_pct", tiers: [{ min: 1, pct: 8 }], skus: ["pc-500", "pc-650"], text: "Additional scheme 8% on Paracip-500 and Paracip-650." },
      { kind: "qty_pct", tiers: [{ min: 1, pct: 4 }], skus: ["pc-susp", "pc-syrup", "pc-drops"], text: "Additional scheme 4% on Suspension, Syrup and Drops." },
    ],
  },
  {
    id: "paracip-15s",
    title: "Paracip 15s and Paracip Aceclo",
    tag: "NEW",
    skus: [
      { id: "p15-500", name: "Paracip-500 (15s)", prices: [batch([14.17, 14.48], 10.21)] },
      { id: "p15-650", name: "Paracip-650 (15s)", prices: [batch([31.65, 32.12], 15.19)] },
      { id: "p15-aceclo", name: "Paracip Aceclo", prices: [p(102.09, 12.38)] },
    ],
    rules: [
      { kind: "qty_pct", tiers: [{ min: 1, pct: 11 }], skus: ["p15-500", "p15-650"], text: "Additional scheme 11% on Paracip 15s." },
      { kind: "qty_pct", tiers: [{ min: 1, pct: 15 }], skus: ["p15-aceclo"], text: "Additional scheme 15% on Paracip Aceclo." },
    ],
  },
  {
    id: "cipladine-bandage",
    title: "Cipladine Bandage",
    skus: [
      { id: "cb-regular", name: "Cipladine Regular Bandage (100+40 strips)", prices: [p(234, 151.27)] },
      { id: "cb-washproof", name: "Cipladine Washproof Bandage (100+36 strips)", prices: [p(281, 181.03)] },
      { id: "cb-1000", name: "Cipladine Washproof 1000s pack with container", prices: [p(2810, 1776.82)] },
    ],
    rules: [
      { kind: "qty_pct", tiers: [{ min: 1, pct: 6 }], skus: ["cb-regular", "cb-washproof"], text: "Secondary scheme 6%." },
      {
        kind: "buy_free_item",
        buy: 1,
        skus: ["cb-1000"],
        free: { name: "Cofsils Lozenges Ginger Lemon (30's) jar", qty: 1 },
        text: "1000s pack: get 1 jar of Cofsils Lozenges Ginger Lemon (30's) free.",
      },
    ],
  },
  {
    id: "cipladine-range",
    title: "Cipladine Range (ointment, solution, gargle, scrub, lotion)",
    skus: [
      { id: "cr-oint-10", name: "Cipladine Ointment 10gm", prices: [batch([32.93, 36.22], 24.78)] },
      { id: "cr-oint-15", name: "Cipladine Ointment 15gm", prices: [batch([49.41, 54.35], 28.65)] },
      { id: "cr-oint-20", name: "Cipladine Ointment 20gm", prices: [batch([61.06, 67.17], 38.79)] },
      { id: "cr-oint-25", name: "Cipladine Ointment 25gm", prices: [batch([82.35, 90.58], 41.49)] },
      { id: "cr-oint-30", name: "Cipladine Ointment 30gm", prices: [batch([98.82, 108.7], 40.58)] },
      { id: "cr-oint-10p", name: "Cipladine Ointment 10gm (10%)", prices: [batch([45.84, 51.04], 24.88)] },
      { id: "cr-oint-125", name: "Cipladine Ointment 125gm", prices: [batch([192.84, 212.12], 127.12)] },
      { id: "cr-oint-250", name: "Cipladine Ointment 250gm", prices: [batch([493.42, 542.76], 229.04)] },
      { id: "cr-powder-10", name: "Cipladine Powder 10gm", prices: [batch([84.4, 92.84], 27.38)] },
      { id: "cr-sol-100", name: "Cipladine 5% Solution 100ml", prices: [batch([45.15, 45.92, 46.21], 39.55)], note: "PTR 38.64 / 39.31 / 39.55 by batch" },
      { id: "cr-sol-500", name: "Cipladine 5% Solution 500ml", prices: [batch([225.75, 229.67, 231.56], 158.09)], note: "PTR 154.39 / 157.07 / 158.09 by batch" },
      { id: "cr-sol-2l", name: "Cipladine 5% Solution 2 Ltrs", prices: [batch([747.48, 760.49, 765.42], 594.45)], note: "PTR 580.52 / 590.62 / 594.45 by batch" },
      { id: "cr-gargle-100", name: "Cipladine Gargle 2% 100ml", prices: [batch([204.63, 225.09], 66.45)] },
      { id: "cr-scrub-100", name: "Cipladine Scrub 7.5% 100ml", prices: [batch([85.05, 86.52, 87.08], 59.98)], note: "PTR 58.58 / 59.60 / 59.98 by batch" },
      { id: "cr-scrub-500", name: "Cipladine Scrub 7.5% 500ml", prices: [batch([429.7, 432.49, 450.16], 293.57)] },
      { id: "cr-calamine", name: "Cipladine Calamine Lotion 100ml", prices: [p(84.37, 30.48)] },
    ],
    rules: [{ kind: "qty_pct", tiers: [{ min: 1, pct: 6 }], text: "Secondary scheme 6% on the Cipladine range." }],
  },
  {
    id: "tugain",
    title: "Tugain Anti-Dandruff Shampoo",
    skus: [{ id: "tg-1", name: "Tugain 2% Ketoconazole Shampoo", prices: [p(285.93, 93.01, 83.71)], note: "Net rate after the 10% additional scheme." }],
    rules: [],
  },
  {
    id: "maxirich",
    title: "Maxirich Portfolio and Iron Tonic",
    skus: [
      { id: "mx-base-strip", name: "Maxirich Base Strips", prices: [batch([114.78, 126.26], 30.15)] },
      { id: "mx-bottle", name: "Maxirich Bottle", prices: [batch([275.84, 303.42], 78.51)] },
      { id: "mx-gold-strip", name: "Maxirich Gold Strips", prices: [p(141.48, 47.29)] },
      { id: "mx-gold-bottle", name: "Maxirich Gold Bottles", prices: [batch([302.54, 332.79], 157.6)] },
      { id: "mx-livercare", name: "Maxirich LiverCare Syrup", prices: [batch([150, 165], 49.88)] },
      { id: "mx-multi", name: "Maxirich Multivitamin Syrup", prices: [batch([142.37, 156.61], 63.89)] },
      { id: "mx-d3", name: "Maxirich Vitamin D3", prices: [p(129.22, 22.75)] },
      { id: "mx-iron-225", name: "Maxirich Iron Tonic 225ml", prices: [batch([140.62, 154.68], 50.52)] },
      { id: "mx-iron-450", name: "Maxirich Iron Tonic 450ml", prices: [p(229.68, 80.9)] },
    ],
    rules: [{ kind: "qty_pct", tiers: [{ min: 1, pct: 5 }], skus: ["mx-iron-450"], text: "5% input on Iron Tonic 450ml." }],
  },
  {
    id: "clocip-antifungal",
    title: "Clocip Antifungal Range",
    skus: [
      { id: "cc-afp-100", name: "Clocip AF Powder 100g (Regular)", prices: [p(121.87, 85.6), p(131.25, 85.6)], note: "MRP 131.25 is TO stock." },
      { id: "cc-afp-120", name: "Clocip AF Powder 120g", prices: [p(157.5, 102.74)] },
      { id: "cc-afp-75", name: "Clocip AF Powder 75g (Regular)", prices: [p(87.18, 64.98), p(95.62, 64.98)] },
      { id: "cc-afp-75n", name: "Clocip AF Powder 75g (Neem)", prices: [p(87.18, 64.98), p(95.62, 64.98)] },
      { id: "cc-l-10", name: "Clocip L Cream 10gm", prices: [p(140.62, 35.29), p(154.68, 35.29)] },
      { id: "cc-l-20", name: "Clocip L Cream 20gm", prices: [p(234.37, 56.49), p(257.81, 56.49)] },
      { id: "cc-cream-15", name: "Clocip Cream 15g", prices: [p(47.25, 23.12), p(48.03, 23.12)] },
      { id: "cc-b-10", name: "Clocip B Cream 10g", prices: [p(59.53, 27.52), p(65.48, 27.52)] },
      { id: "cc-gm-15", name: "Clocip GM Cream 15g", prices: [p(72.18, 18.12), p(78.75, 18.12)] },
      { id: "cc-kz-75", name: "Clocip KZ Soap 75g", prices: [p(88.09, 42.74), p(93.43, 42.74)] },
    ],
    rules: [
      { kind: "qty_pct", tiers: [{ min: 1, pct: 5 }], skus: ["cc-l-10", "cc-l-20", "cc-cream-15", "cc-b-10", "cc-gm-15"], text: "5% on Creams." },
      { kind: "qty_pct", tiers: [{ min: 1, pct: 7 }], skus: ["cc-afp-100", "cc-afp-75"], text: "7% on AF Powder (excluding Neem and AF 120g)." },
      { kind: "qty_pct", tiers: [{ min: 1, pct: 9 }], skus: ["cc-afp-75n", "cc-afp-120"], text: "9% on Neem Powder and AF 120g." },
      {
        kind: "buy_free_item",
        buy: 6,
        skus: ["cc-afp-100", "cc-afp-120", "cc-afp-75", "cc-afp-75n"],
        free: { skuId: "cc-l-10", priceIdx: 0, name: "Clocip L Cream 10gm", qty: 1 },
        text: "Limited time: buy 6 pcs of AF Powder (75g / 100g / 120g, any single SKU) get 1 pc of Clocip-L free.",
      },
      { kind: "note", text: "Trade offers till stocks last." },
    ],
  },
  {
    id: "clocip-prickly-heat",
    title: "Clocip Prickly Heat Powder",
    skus: [
      { id: "ph-150", name: "Clocip Prickly Heat Powder 150g (Regular and Icy Sandal)", prices: [p(107.81, 63.25), p(117.18, 68.75)] },
      { id: "ph-50", name: "Clocip Prickly Heat Powder 50g (Regular)", prices: [p(42.18, 24.75)] },
    ],
    rules: [{ kind: "free_tiers", per: "sku", tiers: [{ min: 9, free: 3 }], repeat: true, text: "Buy 9 get 3 free." }],
  },
  {
    id: "naseline",
    title: "Naseline (Spray, Drops, Saline, Inhaler)",
    skus: [
      { id: "nl-spray", name: "Naseline Nasal Spray", prices: [p(95.25, 56.69), p(104.77, 56.69)] },
      { id: "nl-drops", name: "Naseline Nasal Drops", prices: [p(79.87, 47.58), p(87.85, 47.58)] },
      { id: "nl-saline", name: "Naseline Saline Spray", prices: [p(47.43, 22.01), p(52.12, 22.01)] },
      { id: "nl-inhaler", name: "Naseline Inhaler", prices: [p(60, 20.04)] },
    ],
    rules: [{ kind: "qty_pct", tiers: [{ min: 3, pct: 8 }], skus: ["nl-spray", "nl-drops", "nl-saline"], text: "Secondary scheme 8% on purchase of 3 or more units (Spray, Drops and Saline only)." }],
  },
  {
    id: "cipofresh",
    title: "Cipofresh Mouth Ulcer Gel and Mouth Wash",
    skus: [
      { id: "cf-gel", name: "Cipofresh Mouth Ulcer Gel", prices: [p(72.18, 15.88)] },
      { id: "cf-wash", name: "Cipofresh Mouth Wash", prices: [p(101.25, 32.81)] },
    ],
    rules: [],
  },
  {
    id: "endura-mass",
    title: "Endura Mass",
    skus: [
      { id: "em-500a", name: "Endura Mass 500gm (MRP 604.19)", prices: [p(604.19, 483.35)] },
      { id: "em-500b", name: "Endura Mass 500gm (MRP 621.99)", prices: [p(621.99, 497.59)] },
      { id: "em-500c", name: "Endura Mass 500gm (MRP 666.48)", prices: [p(666.48, 533.18)] },
      { id: "em-1000", name: "Endura Mass 1000gm", prices: [p(1155.88, 924.7)] },
      { id: "em-400", name: "Endura Mass 400gm", prices: [p(549, 439.2)] },
    ],
    rules: [{ kind: "qty_pct", tiers: [{ min: 1, pct: 5 }], text: "Secondary scheme 5%." }],
  },
  {
    id: "mamaxpert-pregtest",
    title: "Mamaxpert Pregtest",
    skus: [{ id: "pg-1", name: "Mamaxpert Pregtest", prices: [p(66.09, 18.33)] }],
    rules: [{ kind: "per_unit_off", tiers: [{ min: 30, amount: 4 }], text: "Secondary input ₹4 per unit on purchase of 30 or more units." }],
  },
  {
    id: "soak-shield",
    title: "Soak Shield Adult Diapers",
    skus: [
      { id: "sk-pant-m", name: "Soak Shield Adult Diaper Pant M (10)", prices: [p(599, 230.42)], note: "PTR without tax 219.45" },
      { id: "sk-pant-l", name: "Soak Shield Adult Diaper Pant L (10)", prices: [p(649, 242.55)], note: "PTR without tax 231.00" },
      { id: "sk-pant-xl", name: "Soak Shield Adult Diaper Pant XL (10)", prices: [p(699, 254.68)], note: "PTR without tax 242.55" },
      { id: "sk-tape-m", name: "Soak Shield Adult Diaper Taped M (10)", prices: [p(559, 230.42)], note: "PTR without tax 219.45" },
      { id: "sk-tape-l", name: "Soak Shield Adult Diaper Taped L (10)", prices: [p(609, 242.55)], note: "PTR without tax 231.00" },
      { id: "sk-tape-xl", name: "Soak Shield Adult Diaper Taped XL (10)", prices: [p(659, 254.68)], note: "PTR without tax 242.55" },
    ],
    rules: [],
  },
  {
    id: "astaberry-skin-care",
    title: "Astaberry Skin Care",
    skus: [
      { id: "asc-lip-aloe", name: "Astaberry Lip Balm Aloe Butter 10g", prices: [p(49, 26.26)] },
      { id: "asc-lip-straw", name: "Astaberry Lip Balm Strawberry 10g", prices: [p(49, 26.26)] },
      { id: "asc-cream-lup", name: "Astaberry Moisturising Cream 15g (jar pack)", prices: [p(10, 8)] },
      { id: "asc-cream-50", name: "Astaberry Moisturising Cream 50gm", prices: [p(95, 57)] },
      { id: "asc-cream-100", name: "Astaberry Moisturising Cream 100gm", prices: [p(179, 107.4)] },
    ],
    rules: [],
  },
  {
    id: "fibocare",
    title: "Fibocare",
    skus: [{ id: "fb-100", name: "Fibocare 100gms", prices: [p(192.18, 128.13)] }],
    rules: [{ kind: "note", text: "5+1 scheme is already in the rate." }],
  },
];

export const OTC_SHEET_2026_10: OtcSheet = {
  id: "2026-10",
  label: "October 2026",
  banner: "Cipla OTC (West 1) rates and schemes for October 2026. Rates are Net PTR including GST.",
  brands,
};
