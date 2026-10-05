"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertStoreSession } from "@/lib/retailerPermissions";
import { assertRole } from "@/lib/permissions";
import { sendPushToStore } from "@/lib/webPush";
import { sendOrderNotificationEmail } from "@/lib/orderEmail";
import { orderStatusLabel } from "@/lib/i18n";
import { normalizeName } from "@/lib/normalizeName";
import { getActiveCatalog } from "@/lib/productCatalog";
import { parseBundleItems, computeFreeUnits } from "@/lib/bannerBundle";
import { isWednesdayToday, getRemainingDealQty } from "@/lib/wednesdayDeals";
import { getStartOfIstDayUtc } from "@/lib/istTime";
import { Prisma, type OrderStatus } from "@/generated/prisma/client";

export interface CartLine {
  productId: string;
  quantity: number;
  // Present when this line was added from the Clearance (near-expiry)
  // screen — the server re-resolves the actual discounted price from this
  // deal's own record, it never trusts a price the client sends.
  expiryItemId?: string;
  // Present when this line was added at a Wednesday Deal price — same
  // never-trust-the-client rule: re-verified against the live deal record,
  // today's day-of-week, and the store's remaining quota for it.
  dealId?: string;
  // Present when this line came from an Offer banner's "add to cart". The
  // server re-verifies the offer is still live and works out for itself how
  // many units are genuinely free; `freeQty` is only the client's claim and
  // can lower, never raise, what the server grants.
  bannerId?: string;
  freeQty?: number;
}

// Checked right before submit so the retailer gets a last-chance warning for
// anything that's actually at 0 — placeOrder itself still allows these lines
// through (the distributor can source on-demand), this is purely a heads-up.
export async function getOutOfStockNames(productIds: string[]): Promise<string[]> {
  if (productIds.length === 0) return [];
  const session = await assertStoreSession();
  const db = getOrgScopedDb(session.orgId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, stock: 0 },
    select: { name: true },
  });
  return products.map((p) => p.name);
}

export async function placeOrder(
  lines: CartLine[],
  notes?: string,
  clientRequestId?: string,
): Promise<{ ok: boolean; error?: string; orderId?: string }> {
  const session = await assertStoreSession();
  const db = getOrgScopedDb(session.orgId);

  // The client retries a submission whenever it can't confirm the first
  // attempt reached the server (dropped connection, backgrounded tab) even
  // though the order may have already committed — recognize that retry by
  // its stable clientRequestId and hand back the original order instead of
  // creating a duplicate.
  if (clientRequestId) {
    const existing = await db.order.findFirst({ where: { clientRequestId } });
    if (existing) return { ok: true, orderId: existing.id };
  }

  const cleanLines = lines.filter((l) => l.quantity > 0);
  if (cleanLines.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  const productIds = cleanLines.map((l) => l.productId);
  const products = await db.product.findMany({ where: { id: { in: productIds }, active: true } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  if (products.length !== new Set(productIds).size) {
    return { ok: false, error: "Some items in your cart are no longer available. Please refresh and try again." };
  }

  const expiryItemIds = [...new Set(cleanLines.map((l) => l.expiryItemId).filter((id): id is string => !!id))];
  const expiryItemMap = expiryItemIds.length
    ? new Map((await db.expiryItem.findMany({ where: { id: { in: expiryItemIds } } })).map((e) => [e.id, e]))
    : new Map<string, Awaited<ReturnType<typeof db.expiryItem.findFirst>>>();

  const dealIds = [...new Set(cleanLines.map((l) => l.dealId).filter((id): id is string => !!id))];
  const dealMap = dealIds.length
    ? new Map((await db.wednesdayDeal.findMany({ where: { id: { in: dealIds } } })).map((d) => [d.id, d]))
    : new Map<string, Awaited<ReturnType<typeof db.wednesdayDeal.findFirst>>>();
  const wednesdayNow = isWednesdayToday();

  function dealIsValidFor(line: CartLine, product: { id: string }): boolean {
    if (!line.dealId) return false;
    const deal = dealMap.get(line.dealId);
    return deal != null && deal.active && wednesdayNow && deal.productId === product.id;
  }

  // A deal's per-retailer cap is rejected outright rather than silently
  // billed at normal price for the overflow — that would charge more than
  // the retailer expected when they added it at the deal price.
  for (const line of cleanLines) {
    const product = productMap.get(line.productId)!;
    if (!dealIsValidFor(line, product)) continue;
    const deal = dealMap.get(line.dealId!)!;
    const remaining = await getRemainingDealQty(session.orgId, session.storeId, deal.id, deal.maxQtyPerStore);
    if (line.quantity > remaining) {
      return {
        ok: false,
        error:
          remaining > 0
            ? `Only ${remaining} left of today's Wednesday Deal price for ${product.name}. Please reduce the quantity.`
            : `You've reached today's Wednesday Deal limit for ${product.name}.`,
      };
    }
  }

  // Offer banners: each line tagged with a bannerId must point at an offer
  // that is still live. An offer that ended while the item sat in the cart is
  // rejected outright rather than silently billed at full price, same
  // reasoning as the Wednesday Deal cap above.
  const bannerIds = [...new Set(cleanLines.map((l) => l.bannerId).filter((id): id is string => !!id))];
  const bannerRows = bannerIds.length
    ? await db.shopBanner.findMany({
        where: { id: { in: bannerIds }, active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        select: { id: true, title: true, cartItems: true, cartRemark: true },
      })
    : [];
  const bannerMap = new Map(
    bannerRows.map((b) => [b.id, { title: b.title, remark: b.cartRemark, items: parseBundleItems(b.cartItems) }]),
  );
  if (bannerMap.size !== bannerIds.length) {
    return {
      ok: false,
      error: "An offer in your cart is no longer available. Please remove it from your cart and try again.",
    };
  }

  // How many free units a banner line really earns: the offer's free units
  // per set, times the number of complete sets in this order, never more than
  // the client claimed or the line holds.
  function freeUnitsFor(line: CartLine): { free: number; label?: string } {
    const banner = line.bannerId ? bannerMap.get(line.bannerId) : undefined;
    if (!banner) return { free: 0 };
    const orderedByProduct = new Map<string, number>();
    for (const l of cleanLines) {
      if (l.bannerId === line.bannerId) {
        orderedByProduct.set(l.productId, (orderedByProduct.get(l.productId) ?? 0) + l.quantity);
      }
    }
    return { free: computeFreeUnits(banner.items, orderedByProduct, line), label: banner.title ?? "Offer" };
  }

  // An offer can fix its own per-unit rate for a product (e.g. a bundle price
  // for the main item). Read from the stored offer, never from the client, and
  // only for a line tagged with that live offer; a clearance/deal rate on the
  // same line wins over it below.
  function offerPriceFor(line: CartLine): number | undefined {
    const banner = line.bannerId ? bannerMap.get(line.bannerId) : undefined;
    return banner?.items.find((i) => i.productId === line.productId)?.offerPrice;
  }

  // Prices are always taken from the current catalog on the server — never
  // trust a client-submitted price. A clearance/deal line only gets the
  // special rate if the deal it points at is still live AND actually names
  // this same product — otherwise a client could pair a cheap deal's id
  // with an unrelated, expensive product to buy it at the wrong price.
  const today = getStartOfIstDayUtc();
  const orderLines = cleanLines.map((l) => {
    const product = productMap.get(l.productId)!;
    const expiryItem = l.expiryItemId ? expiryItemMap.get(l.expiryItemId) : undefined;
    const expiryDealIsValid =
      expiryItem != null &&
      expiryItem.specialRate != null &&
      expiryItem.expiryDate >= today &&
      normalizeName(expiryItem.itemName) === normalizeName(product.name);
    const weeklyDealIsValid = dealIsValidFor(l, product);

    const unitPrice = expiryDealIsValid
      ? Number(expiryItem!.specialRate)
      : weeklyDealIsValid
        ? Number(dealMap.get(l.dealId!)!.dealPrice)
        : offerPriceFor(l) ?? Number(product.price);

    // A free offer unit never stacks with a clearance/deal rate on the same line.
    const offer = expiryDealIsValid || weeklyDealIsValid ? { free: 0 } : freeUnitsFor(l);
    const scheme = offer.free > 0 ? `${offer.label}: ${offer.free} free` : (product.scheme ?? undefined);

    return {
      productId: product.id,
      productName: product.name,
      unitPrice,
      quantity: l.quantity,
      lineTotal: unitPrice * (l.quantity - offer.free),
      dealId: weeklyDealIsValid ? l.dealId : undefined,
      // Only a line the live offer actually priced/discounted counts as bought
      // through it (a clearance/deal rate on the line wins over the offer).
      bannerId:
        l.bannerId && bannerMap.has(l.bannerId) && !expiryDealIsValid && !weeklyDealIsValid ? l.bannerId : undefined,
      scheme,
    };
  });
  const totalAmount = orderLines.reduce((sum, l) => sum + l.lineTotal, 0);

  // Each live offer in the order stamps its remark (e.g. "Free lunch box")
  // into the notes, so billing sees it on the order and in the email.
  const offerRemarks = [...bannerMap.values()]
    .filter((b) => b.remark)
    .map((b) => `${b.title ?? "Offer"}: ${b.remark}`);
  const bookedNote = session.bookedBy
    ? `Booked by ${session.bookedBy}${session.bookedByRole ? ` (${session.bookedByRole.toLowerCase()})` : ""} for the retailer`
    : undefined;
  const finalNotes = [bookedNote, notes?.trim(), ...offerRemarks].filter(Boolean).join("\n") || undefined;

  let order;
  try {
    order = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orgId: session.orgId,
          storeId: session.storeId,
          totalAmount,
          notes: finalNotes,
          clientRequestId,
        },
      });
      await tx.orderItem.createMany({
        data: orderLines.map((l) => ({ orgId: session.orgId, orderId: order.id, ...l })),
      });
      return order;
    });
  } catch (err) {
    // Two submissions with the same clientRequestId landed at (almost) the
    // same time — the unique constraint caught what the earlier findFirst
    // check couldn't. Whichever won, return its order rather than erroring.
    if (clientRequestId && err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await db.order.findFirst({ where: { clientRequestId } });
      if (existing) return { ok: true, orderId: existing.id };
    }
    throw err;
  }

  revalidatePath("/shop/orders");
  revalidatePath("/team/admin/orders");

  // Best-effort — a failed/misconfigured email send must never block the
  // order itself, which is already committed above. The real fail-safe is
  // adminSeenAt (set when an admin views the orders list); emailSentAt here
  // is only a diagnostic trail so a silent email failure is visible instead
  // of invisible, and stays null if every retry inside the helper failed.
  const [orderingStore, ordersTodayCount] = await Promise.all([
    db.store.findUnique({
      where: { id: session.storeId },
      select: { orderGiverWhatsapp: true, externalCode: true, address: true },
    }),
    // Counts this order too (already committed above) — so billing sees "2nd
    // order today" rather than having to infer it from a count that excludes
    // the very order they're looking at.
    db.order.count({
      where: { storeId: session.storeId, createdAt: { gte: getStartOfIstDayUtc() } },
    }),
  ]);
  sendOrderNotificationEmail({
    orderNumber: order.orderNumber,
    storeName: session.storeName ?? "Retailer",
    storeCode: orderingStore?.externalCode,
    storeAddress: orderingStore?.address,
    orderGiverWhatsapp: orderingStore?.orderGiverWhatsapp,
    ordersTodayCount,
    totalAmount,
    notes: finalNotes,
    lines: orderLines.map((l) => ({
      productName: l.productName,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      scheme: l.scheme,
    })),
  })
    .then(() => db.order.update({ where: { id: order.id }, data: { emailSentAt: new Date() } }))
    .catch((err) => {
      console.error("sendOrderNotificationEmail failed for order", order.id, err);
    });

  return { ok: true, orderId: order.id };
}

export interface ReorderLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

// Re-prices an order's items from the current catalog, never the order's old
// snapshot — the same rule placeOrder uses when the cart is actually
// submitted. Shared by the per-order Reorder button and the home page's
// one-tap reorder.
async function buildReorderLines(
  orgId: string,
  order: {
    items: Array<{ productId: string; productName: string; quantity: number; bannerId?: string | null; lineTotal?: unknown }>;
  },
): Promise<{ lines: ReorderLine[]; unavailable: string[] }> {
  const db = getOrgScopedDb(orgId);
  // Lines bought through an offer (offer-only price, free units) and lines that
  // were entirely free are not repeated here: they would come back at the
  // plain catalog rate (or as paid items). The retailer taps the offer again.
  const repeatable = order.items.filter((i) => !i.bannerId && !(i.lineTotal != null && Number(i.lineTotal) === 0));
  const productIds = repeatable.map((i) => i.productId);
  const products = await db.product.findMany({ where: { id: { in: productIds }, active: true } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const lines: ReorderLine[] = [];
  const unavailable: string[] = [];
  for (const item of repeatable) {
    const product = productMap.get(item.productId);
    if (!product) {
      unavailable.push(item.productName);
      continue;
    }
    lines.push({
      productId: product.id,
      name: product.name,
      unitPrice: Number(product.price),
      quantity: item.quantity,
    });
  }
  return { lines, unavailable };
}

export async function getReorderLines(
  orderId: string,
): Promise<{ ok: boolean; error?: string; lines?: ReorderLine[]; unavailable?: string[] }> {
  const session = await assertStoreSession();
  const db = getOrgScopedDb(session.orgId);

  const order = await db.order.findFirst({
    where: { id: orderId, storeId: session.storeId },
    include: { items: true },
  });
  if (!order) return { ok: false, error: "Order not found." };

  const { lines, unavailable } = await buildReorderLines(session.orgId, order);

  if (lines.length === 0) {
    return { ok: false, error: "None of the items in this order are available anymore." };
  }

  return { ok: true, lines, unavailable };
}

export interface OneTapReorderData {
  source: "last_order" | "frequent_items" | "none";
  orderDate?: string;
  lines: ReorderLine[];
  unavailable: string[];
}

// Powers the shop home page's one-tap Reorder card: the retailer's own last
// order if they've placed one through the app before, falling back to their
// frequently-bought items (own order history + admin-uploaded purchase
// history) for a store that's never ordered through the app yet.
export async function getOneTapReorderData(): Promise<OneTapReorderData> {
  const session = await assertStoreSession();
  const db = getOrgScopedDb(session.orgId);

  const lastOrder = await db.order.findFirst({
    where: { storeId: session.storeId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  if (lastOrder) {
    const { lines, unavailable } = await buildReorderLines(session.orgId, lastOrder);
    if (lines.length > 0) {
      return { source: "last_order", orderDate: lastOrder.createdAt.toISOString(), lines, unavailable };
    }
  }

  const frequentItems = await getFastOrderItems();
  const lines: ReorderLine[] = frequentItems.slice(0, 10).map((item) => ({
    productId: item.productId,
    name: item.name,
    unitPrice: item.unitPrice,
    quantity: Math.max(1, item.usualQuantity),
  }));

  return { source: lines.length > 0 ? "frequent_items" : "none", lines, unavailable: [] };
}

export interface FastOrderItem {
  productId: string;
  name: string;
  company: string | null;
  unitPrice: number;
  stock: number | null;
  usualQuantity: number;
  source: "ordered" | "history";
}

// Combines two sources of "what this retailer regularly needs": their own
// past in-app orders (a direct productId link) and admin-uploaded historical
// purchase data (free-text item names, matched against the catalog by exact
// normalized name — the same conservative match used for the stock import,
// since a wrong match here would add the wrong product to someone's order).
export async function getFastOrderItems(): Promise<FastOrderItem[]> {
  const session = await assertStoreSession();
  const db = getOrgScopedDb(session.orgId);

  const [orderedGroups, historyGroups, catalog] = await Promise.all([
    db.orderItem.groupBy({
      by: ["productId"],
      where: { order: { storeId: session.storeId } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 50,
    }),
    db.fastOrderItem.groupBy({
      by: ["itemName"],
      where: { storeId: session.storeId },
      _sum: { quantity: true, totalValue: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 100,
    }),
    getActiveCatalog(session.orgId),
  ]);

  const productById = new Map(catalog.map((p) => [p.id, p]));
  const productByNormalizedName = new Map(catalog.map((p) => [normalizeName(p.name), p]));

  const items: FastOrderItem[] = [];
  const seenProductIds = new Set<string>();

  for (const g of orderedGroups) {
    const product = productById.get(g.productId);
    if (!product) continue;
    seenProductIds.add(product.id);
    items.push({
      productId: product.id,
      name: product.name,
      company: product.company,
      unitPrice: product.price,
      stock: product.stock,
      usualQuantity: Math.round(Number(g._sum.quantity ?? 0)),
      source: "ordered",
    });
  }

  for (const g of historyGroups) {
    const product = productByNormalizedName.get(normalizeName(g.itemName));
    if (!product || seenProductIds.has(product.id)) continue;
    seenProductIds.add(product.id);
    items.push({
      productId: product.id,
      name: product.name,
      company: product.company,
      unitPrice: product.price,
      stock: product.stock,
      usualQuantity: Math.round(Number(g._sum.quantity ?? 0)),
      source: "history",
    });
  }

  return items.slice(0, 60);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const order = await db.order.update({ where: { id: orderId }, data: { status } });

  revalidatePath("/team/admin/orders");

  // Best-effort — a retailer with no push subscription (or a push-service
  // hiccup) must never block the admin from updating an order's status.
  // No stored language preference per store, so this defaults to the
  // project's default language (Marathi) same as a fresh, unconfigured session.
  sendPushToStore(session.orgId, order.storeId, {
    title: "J P Traders",
    body: `${orderStatusLabel("mr", status)}: ₹${Number(order.totalAmount).toLocaleString("en-IN")}`,
    url: `/shop/orders/${order.id}`,
  }).catch(() => {});
}
