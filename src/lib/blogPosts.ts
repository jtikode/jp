// Static content for the public /blog section — no CMS, just data. Keeping
// posts here (not in the database) means they ship with the app, need no
// admin UI, and stay in version control like everything else.

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string };

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  readMinutes: number;
  content: BlogBlock[];
}

const p = (text: string): BlogBlock => ({ type: "p", text });
const h2 = (text: string): BlogBlock => ({ type: "h2", text });
const ul = (items: string[]): BlogBlock => ({ type: "ul", items });
const quote = (text: string): BlogBlock => ({ type: "quote", text });

export const blogPosts: BlogPost[] = [
  {
    slug: "generic-medicine-wholesale-variety",
    title: "7,000+ Products, 135+ Companies: The Real Variety Behind J P Traders' Catalog",
    description:
      "A look at how wide a single J P Traders bill actually runs — 135+ companies, 2,000+ molecules, and why that range matters more to a medical store than any single brand.",
    category: "Our Range",
    readMinutes: 5,
    content: [
      p(
        "Ask most retailers what their distributor offers and you'll get a vague answer: \"generics, OTC, some surgicals.\" Ask us, and we can actually show you the number, because it lives in the same database that runs our billing: as of today, J P Traders carries 7,000+ active products across 135+ companies, spanning over 2,000 distinct molecules and 48 product categories.",
      ),
      p(
        "That's not a marketing figure rounded up for effect — it's the literal count of what's orderable right now through the app, the same catalog a retailer searches when they open J P Traders on their phone.",
      ),
      h2("Why the number of companies matters more than it sounds"),
      p(
        "A medical store doesn't lose customers because it's missing one brand — it loses them because it's missing an answer. A customer walks in with a prescription for a molecule your usual supplier doesn't carry under that particular brand, and if you can't source it in the next five minutes, that customer walks to the next store and may not come back.",
      ),
      p(
        "Carrying 135+ companies on one distributor account means a far higher chance that whatever a doctor has prescribed — whichever manufacturer made it — is already in your catalog, at your usual rate, on your usual credit terms. You're not chasing five different distributors for five different brands of the same molecule.",
      ),
      h2("Depth, not just breadth"),
      p(
        "Variety isn't only about how many brands you can source — it's about how many alternatives you can offer the moment one is out of stock. Because our catalog is organized by composition (the actual salt, not just the brand name), a retailer searching for one medicine on the app automatically sees every other product sharing that exact composition — sorted by what's actually in stock first.",
      ),
      p(
        "In practice, that means a stockout on one brand rarely means a lost sale anymore. You show the customer the alternative on the spot, at the counter, without a phone call to the distributor.",
      ),
      h2("What this looks like on the ground"),
      ul([
        "2,000+ distinct molecules — from everyday antibiotics and painkillers to specialised cardiac and diabetic therapies",
        "48 product categories, from Diclofenac sprays and ORS to eye drops, anti-fungal creams and baby care",
        "1,000+ products currently running a live scheme (buy-X-get-Y-free) at any given time",
        "A catalog that updates from the same stock file used for billing — what you see on the app is what's actually on the shelf",
      ]),
      quote(
        "A wide catalog isn't a convenience feature — for a medical store, it's the difference between a sale and a walkout.",
      ),
      p(
        "If you're a retailer and haven't browsed the full catalog yet, it's worth ten minutes on the app just to see what's there. More often than not, the answer to \"do you stock this?\" turns out to be yes.",
      ),
    ],
  },
  {
    slug: "branded-generics-vs-generics-margin",
    title: "Branded Generics vs. Plain Generics: Which Actually Earns Your Pharmacy More?",
    description:
      "Branded generics usually cost a customer a little more than a plain generic of the same molecule — here's why that gap is exactly what puts more margin in a retailer's pocket, not less.",
    category: "Margins",
    readMinutes: 6,
    content: [
      p(
        "There's a persistent myth on the retail floor that generics are \"low margin\" and branded medicines are where the real money is. It's backwards. In the Indian pharma trade, it's usually the branded generic — not the pure, unbranded generic, and not the original innovator brand — that gives a medical store owner the best margin per strip.",
      ),
      h2("Three products, one molecule, three different margins"),
      p(
        "Take any common molecule. You'll typically find it available in three forms: the original innovator brand (expensive, thin retailer margin, but instant recognition), a plain unbranded generic (very cheap, but often a wafer-thin margin in absolute rupees because the MRP itself is so low), and a branded generic — a company-backed version sold under its own brand name, priced well below the innovator but with a healthier MRP than the plain generic.",
      ),
      p(
        "That branded generic is usually where the retailer's actual earnings are highest. The MRP is high enough to carry a meaningful margin in rupee terms, the manufacturer typically offers trade schemes and credit terms a plain generic maker won't, and — critically — the customer trusts a recognisable brand name enough to pay the asking price without haggling at the counter.",
      ),
      h2("Why this isn't just theory"),
      p(
        "Look at our own catalog: well over 1,000 products currently carry a live scheme — a \"buy 5 get 1 free\" or similar offer — and the overwhelming majority of those are branded generics from the companies we distribute, not unbranded commodity stock. Companies build schemes into branded generics specifically because they're competing on margin and loyalty, not just on lowest price.",
      ),
      ul([
        "Innovator brand: highest customer trust, lowest retailer margin",
        "Plain/unbranded generic: lowest customer price, lowest absolute margin per strip",
        "Branded generic: strong customer trust at a lower price than the innovator, and the best margin stack once you count in scheme offers and credit terms",
      ]),
      h2("What this means at your counter"),
      p(
        "When a customer asks for \"something cheaper\" for a molecule, reaching for a branded generic first — rather than defaulting to whatever plain generic happens to be cheapest — usually serves both of you better. The customer still saves real money versus the innovator brand, and your margin on that sale is typically stronger than it would be on the unbranded option.",
      ),
      quote("Cheapest for the customer and best for your margin are not the same product — and they're rarely the innovator brand either."),
      p(
        "This is exactly why we stock multiple branded-generic options per molecule rather than just one: so you have a real choice to make at the counter, not just a single SKU to push.",
      ),
    ],
  },
  {
    slug: "why-branded-generics-build-trust",
    title: "Why Branded Generics Win Customer Trust (and Repeat Business)",
    description:
      "A brand name on a generic medicine isn't just packaging — it's a shortcut to trust that keeps customers coming back to the same strip, and the same store, every month.",
    category: "Margins",
    readMinutes: 5,
    content: [
      p(
        "A customer standing at your counter usually can't tell one 500mg tablet from another by looking at it. What they can recognise is a name they've seen before — on a previous strip, in an advertisement, or recommended by a doctor. That recognition is the entire value of a branded generic, and it's worth more to your business than it might seem.",
      ),
      h2("Repeat purchase is the real prize"),
      p(
        "A customer who bought an unbranded generic last month has no reason to ask for it by name next time — they'll ask for \"the same thing\" and leave the choice entirely to whoever's behind the counter, including a competitor's counter. A customer who bought a branded generic will often ask for that brand specifically. That's a sale that follows the brand, and because you stock it, it follows you too.",
      ),
      h2("Doctors prescribe brands, not molecules"),
      p(
        "Most prescriptions in India are still written by brand name, not generic molecule name. Stocking the branded generics that are actually in common prescription rotation in your area means fewer \"sorry, we don't have that one\" moments — and fewer customers walking next door to find it.",
      ),
      h2("Quality perception isn't just marketing"),
      p(
        "Reputable branded-generic manufacturers put real resources into consistent manufacturing quality and batch-to-batch reliability, specifically because their brand name is on the line with every strip sold. That consistency is worth something real to a customer managing a chronic condition on the same medicine month after month — and it's worth something to you as the store that sold it to them without a complaint.",
      ),
      ul([
        "Brand recognition drives repeat, named requests instead of generic \"anything will do\" purchases",
        "Doctor prescriptions in India are overwhelmingly brand-led, not molecule-led",
        "Consistent manufacturing quality reduces the chance of a customer complaint landing on your counter",
        "A trusted brand name reduces price negotiation at the point of sale",
      ]),
      quote("A brand name is the manufacturer's trust, lent to you at the counter for free."),
      p(
        "This is why, across J P Traders' 135+ manufacturer base, the branded-generic names tend to be the fastest movers on the app — retailers already know which names their own customers ask for by heart.",
      ),
    ],
  },
  {
    slug: "understanding-pharmacy-margins-mrp-ptr",
    title: "MRP, PTR and Margin: A Plain-English Guide for Medical Store Owners",
    description:
      "MRP, PTR, scheme discount, GST — a straightforward walkthrough of how these actually combine into what lands in a retailer's pocket on every strip sold.",
    category: "Margins",
    readMinutes: 6,
    content: [
      p(
        "Every price label on a medicine strip carries more information than most customers ever read — and more opportunity than many retailers actually use. Here's a plain walkthrough of the numbers that decide what you actually earn.",
      ),
      h2("MRP — what the customer pays, not what you earn"),
      p(
        "The Maximum Retail Price is the ceiling, not your income. It's printed so the customer knows they can't legally be charged more. Your margin is the gap between what you pay the distributor and what you collect from the customer — and that gap can vary wildly between two products with an identical MRP.",
      ),
      h2("PTR / your buying rate — where the real comparison happens"),
      p(
        "Your buying rate (what you pay the distributor, sometimes called PTR — price to retailer) is where the real margin decision gets made. Two products can carry the same MRP but a very different buying rate, which means a very different margin for you, even though the customer pays the same amount either way. This is exactly why it pays to actually compare rather than assume \"generic = cheap for me too.\"",
      ),
      h2("Scheme offers — margin you can miss if you're not looking"),
      p(
        "A \"5+1\" or \"10+2\" scheme effectively lowers your real buying cost per unit without ever touching the printed MRP the customer pays. On J P Traders, 1,000+ products currently carry a live scheme of this kind — and because schemes rotate company to company, the product with the best headline margin this month might not be the one with the best real margin once you account for the scheme attached to a competing brand.",
      ),
      h2("GST — small on paper, meaningful over a month"),
      p(
        "Most pharmaceutical products carry a modest GST slab, but it still affects your landed cost and your input credit if you're GST-registered. It's worth knowing the rate on your fast-moving lines, not just trusting the final number on the invoice.",
      ),
      ul([
        "MRP = ceiling price to the customer, not your earnings",
        "Buying rate / PTR = where your real margin is actually decided",
        "Scheme offers = effective discount on your buying rate, invisible on the shelf",
        "GST = small per unit, real over hundreds of strips a month",
      ]),
      quote("The sticker on the strip tells the customer what to pay. It doesn't tell you what you earned — only your buying rate and the scheme behind it do."),
      p(
        "This is the exact reason every product listing on the J P Traders app shows your rate, the MRP, the tax slab and any live scheme together on one line — so the comparison takes five seconds, not a phone call.",
      ),
    ],
  },
  {
    slug: "scheme-offers-boost-margin",
    title: "How \"Buy 5 Get 1 Free\" Schemes Quietly Boost Your Real Margin",
    description:
      "Scheme offers don't show up on the MRP sticker, which is exactly why so many retailers underestimate how much they add to real, per-strip margin.",
    category: "Margins",
    readMinutes: 5,
    content: [
      p(
        "A \"5+1 (20% Free)\" tag on a product listing looks like a small thing. Do the arithmetic across a month of ordering, and it stops looking small.",
      ),
      h2("The arithmetic retailers skip"),
      p(
        "A 5+1 scheme means you pay for 5 units and receive 6. That's a 16.7% reduction in your real cost per unit — bigger than most retailers' entire markup on some fast-moving lines. A 9+1 scheme is a smaller but still meaningful 10% reduction. None of this shows up anywhere on the MRP the customer sees; it's purely extra margin that lands in your pocket if you actually order in scheme quantities.",
      ),
      h2("Why schemes exist in the first place"),
      p(
        "Manufacturers run schemes to move volume and to compete for shelf space against a crowded field of branded generics carrying the same molecule. The company offering the best current scheme on a molecule you sell regularly is often worth switching to for that month — your customer pays the same MRP either way, but your cost per strip just dropped.",
      ),
      h2("The ordering habit that captures it"),
      p(
        "The retailers who benefit most from schemes aren't the ones who notice an offer once and remember it — they're the ones who check before every re-order, because scheme availability on fast movers shifts from month to month. On J P Traders, over 1,000 products carry a live scheme at any given time, and it's flagged directly on the product card while you're ordering, not buried in a separate circular you have to dig up.",
      ),
      ul([
        "A 5+1 scheme = ~16.7% off your real buying cost, invisible to the customer",
        "Scheme availability rotates — the best-margin brand on a molecule can change month to month",
        "Checking at order time, not from memory, is what actually captures the saving",
        "Scheme + branded-generic trust together usually beats either one alone",
      ]),
      quote("A scheme you didn't notice is margin you paid for and never collected."),
      p(
        "It's a five-second habit: before confirming a re-order on a fast-moving molecule, glance at whether a scheme is currently live on it. Over a few hundred orders a year, that habit adds up to real money.",
      ),
    ],
  },
  {
    slug: "2000-molecules-why-range-matters",
    title: "2,000+ Molecules on One Bill: Why Range Matters More Than Price",
    description:
      "A distributor with the widest range wins more orders than one with the lowest price on a handful of fast movers — here's the business logic behind why.",
    category: "Our Range",
    readMinutes: 5,
    content: [
      p(
        "Retailers often choose a primary distributor based on the price of their ten best-selling products. It's an understandable instinct — but it misses where the real cost of a distributor relationship actually shows up: in every order that has to be split across two, three, or four suppliers because no single one carries everything you need.",
      ),
      h2("The hidden cost of a split order"),
      p(
        "Every extra distributor on your books means an extra delivery to track, an extra ledger to reconcile, an extra set of credit terms to manage, and an extra phone call when something's short. None of that shows up as a line item anywhere, but it costs real time — and time behind the counter is time not spent serving customers.",
      ),
      h2("What 2,000+ molecules actually buys you"),
      p(
        "At J P Traders, the catalog spans over 2,000 distinct molecules across 48 categories — everything from everyday pain relief and cold & cough, through antibiotics, cardiac and diabetic therapies, to surgicals, baby care and daily OTC lines like ORS, eye drops and antiseptics. The goal isn't to be the cheapest on any single item; it's that a retailer rarely needs to open a second distributor relationship just to complete one day's orders.",
      ),
      h2("Range also protects you from stockouts"),
      p(
        "A distributor with deep range — multiple companies carrying the same molecule — means a stockout on one brand is rarely a stockout on the molecule itself. The app automatically shows alternatives sharing the same composition the moment you search, ranked with whatever's actually in stock shown first.",
      ),
      ul([
        "2,000+ molecules across 48 product categories on one account",
        "135+ manufacturer companies, so one brand being short rarely means the molecule is unavailable",
        "Alternatives by composition shown automatically when you search a product",
        "Fewer distributor relationships to manage means fewer reconciliation headaches at month-end",
      ]),
      quote("The cheapest price on ten products matters less than never having to call a second distributor on the other forty."),
      p(
        "If your current ordering routine involves more than one supplier to cover a normal day's requirements, it's worth checking how much of that list is actually already sitting in a single J P Traders catalog.",
      ),
    ],
  },
  {
    slug: "top-otc-categories-every-pharmacy-should-stock",
    title: "10 OTC Categories Every Medical Store Should Never Run Out Of",
    description:
      "Walk-in, no-prescription-needed categories are where a lot of daily footfall and small-ticket margin actually comes from — here are ten worth always having in stock.",
    category: "Our Range",
    readMinutes: 6,
    content: [
      p(
        "Prescription medicines get most of the attention, but a meaningful share of a medical store's daily footfall walks in asking for something that needs no prescription at all. Running out of these categories doesn't just cost one sale — it trains a customer to go elsewhere for the small, frequent purchases that build loyalty over time.",
      ),
      h2("The ten categories worth never running short on"),
      ul([
        "ORS (powder and liquid) — year-round demand, spikes hard in summer and during any stomach upset season",
        "Eye drops — a small, frequent repeat-purchase category with strong brand loyalty once a customer finds one that works",
        "Diclofenac sprays and gels — a top-moving pain-relief category with very frequent repeat buyers",
        "Anti-fungal creams and powders — steady, embarrassment-driven demand that customers don't want to delay buying",
        "Antacid syrups — fast, frequent, small-ticket but high-frequency purchases",
        "Baby care essentials — brings parents into the store regularly, often alongside other purchases",
        "Medicated soaps and face washes — low per-unit value but very high repeat frequency",
        "Cold & cough / anticold tablets — seasonal spikes that are easy to predict and easy to be caught short on",
        "Lozenges and mouth ulcer gels — impulse and walk-in purchases with minimal consideration time",
        "Ear drops — low volume but a customer who finds you out of stock rarely waits; they go next door",
      ]),
      h2("Why these specifically"),
      p(
        "Every category on this list shares three traits: no prescription friction, high repeat-purchase frequency, and low per-unit price that customers won't wait around or travel far to save on. That combination means stock availability — not price — is usually what decides whether the sale happens at your counter or a competitor's.",
      ),
      quote("For high-frequency, low-friction categories, being in stock beats being cheap almost every time."),
      p(
        "On J P Traders, these categories alone span dozens of brands each — the Diclofenac spray/gel category alone runs to 65+ active listings, and ORS liquid and powder together run over 30. Browsing by category on the app rather than searching product-by-product is often the fastest way to spot a gap in what you're currently stocking.",
      ),
    ],
  },
  {
    slug: "near-expiry-clearance-stock-strategy",
    title: "Near-Expiry Stock Isn't a Loss — It's a Margin Opportunity",
    description:
      "Stock approaching its expiry date is usually written off as a loss before it's sold. Treated right, it's one of the easiest extra-margin opportunities in the store.",
    category: "Margins",
    readMinutes: 5,
    content: [
      p(
        "Most retailers only notice an expiry date when it's already too late — stock sitting unsold, the deadline a few weeks out, and a return process to the distributor that eats time and goodwill. The better outcome is catching it early enough to actually sell it, ideally at a price that still protects your margin.",
      ),
      h2("Why near-expiry stock still has value"),
      p(
        "A product with six to twelve months of shelf life left is still fully usable medicine — it's only a liability if it sits unsold until it genuinely expires. Sold at even a modest discount with a few months still on the clock, it converts from a write-off into a sale, and often at a margin that's still better than the alternative of a distributor return or a total loss.",
      ),
      h2("How J P Traders surfaces this automatically"),
      p(
        "Rather than relying on a retailer to manually track expiry dates across thousands of SKUs, the app flags products approaching expiry directly on the product card as they're browsing — and maintains a dedicated Clearance list of near-expiry stock at a special, already-discounted rate, so the markdown decision is made once, centrally, instead of store by store.",
      ),
      h2("The habit that protects margin"),
      ul([
        "Check the Clearance list before placing a routine order — sometimes the stock you need is already there at a better rate",
        "Prioritise selling near-expiry stock to walk-in, price-sensitive customers rather than leaving it at the back of the shelf",
        "Don't over-order slow-moving lines just because of a scheme — a scheme discount doesn't help if the stock expires unsold",
        "Rotate stock physically (oldest expiry to the front) so staff naturally sell it first without having to think about it",
      ]),
      quote("Unsold near-expiry stock is a guaranteed loss. Sold near-expiry stock, even discounted, is still a sale."),
      p(
        "The goal isn't to avoid near-expiry stock entirely — some of it is simply the natural tail of normal ordering. The goal is to catch it early enough that selling it is still a choice, not a forced write-off.",
      ),
    ],
  },
  {
    slug: "avoiding-stockouts-retailer-reputation",
    title: "The Hidden Cost of a Stockout: Lost Sales, Lost Trust",
    description:
      "A stockout rarely shows up as a number on your books, but it quietly costs more than the single sale it loses — here's why it's worth protecting against.",
    category: "Operations",
    readMinutes: 5,
    content: [
      p(
        "A stockout doesn't send you an invoice. There's no line item in your books that says \"lost ₹X because item Y wasn't on the shelf.\" That invisibility is exactly why it's so easy to underestimate how much a stockout actually costs a medical store over a year.",
      ),
      h2("It's rarely just one lost sale"),
      p(
        "A customer who can't get a regular medicine at your counter doesn't just lose that one purchase for you — they often find it elsewhere, and if that alternative store serves them well, some share of that customer's future business goes with it. For a chronic-medication customer buying the same strip every month, one stockout can mean losing a relationship worth a dozen future sales, not just one.",
      ),
      h2("Why it happens even to careful retailers"),
      p(
        "Stockouts aren't usually a sign of carelessness — they're a sign of an ordering routine that depends on memory and habit rather than live visibility into what's actually on the shelf versus what's actually selling. A fast-moving molecule can run out between two scheduled order days without anyone noticing until a customer asks for it.",
      ),
      h2("What reduces the risk"),
      ul([
        "Order on a tighter, more frequent cycle for your genuinely fast-moving lines, rather than one large weekly order for everything",
        "Use a digital catalog that shows real stock levels at order time, not a printed rate list from last month",
        "Keep an eye on products flagged Low Stock in your own regular order history before they hit zero on the distributor's side too",
        "Lean on alternatives by composition when your usual brand is tight, rather than turning the customer away entirely",
      ]),
      quote("A stockout costs you the sale you can see — and some share of the ones you'll never know you lost."),
      p(
        "This is the exact problem the J P Traders app's Low Stock and alternatives features exist to solve: surfacing a tightening stock position before it becomes a hard stockout, and offering a same-molecule alternative the moment it does.",
      ),
    ],
  },
  {
    slug: "digital-ordering-platform-for-pharmacies",
    title: "From WhatsApp to App: How J P Traders Makes Ordering Medicines Simple",
    description:
      "A look at why J P Traders built a dedicated ordering app for retailers instead of leaving ordering to phone calls and WhatsApp messages — and what it actually changes day to day.",
    category: "Operations",
    readMinutes: 5,
    content: [
      p(
        "For a long time, ordering from a pharma distributor meant a phone call, a WhatsApp voice note, or handing a list to a visiting salesman and hoping nothing got missed in translation. It works, but it's slow, error-prone, and gives the retailer almost no visibility into rate, stock or scheme until the bill arrives.",
      ),
      h2("What changes with a direct ordering app"),
      p(
        "The J P Traders app lets a retailer search the full live catalog, see the current rate, MRP, tax slab, stock position and any running scheme on a product in one glance, and place an order directly — no waiting for a callback to confirm whether something's actually in stock.",
      ),
      h2("Built around how a medical store actually orders"),
      ul([
        "Search by product name or by salt/composition, so you can find an alternative the moment your usual brand is low",
        "Low Stock shown directly on the product card instead of hidden until the order fails",
        "Live scheme offers flagged on the listing itself, not buried in a separate circular",
        "A Clearance section for near-expiry stock at an already-discounted rate",
        "Full order history, so re-ordering your regular basket takes seconds, not a re-typed list",
      ]),
      h2("Why this matters for margin, not just convenience"),
      p(
        "Every feature above connects back to the same goal covered elsewhere on this blog: better visibility into rate, scheme and stock at the moment of ordering is what actually protects a retailer's margin. A phone order relies on someone remembering to mention a scheme. An app shows it on the listing by default.",
      ),
      quote("The best ordering system is the one that shows you the full picture before you commit, not after the bill arrives."),
      p(
        "Over 3,400 retailers already place orders through the J P Traders platform. If you're still ordering primarily by phone or WhatsApp, it's worth asking your J P Traders representative — or reaching out on WhatsApp directly — about getting set up with app access.",
      ),
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
