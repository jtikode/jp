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
import { isWednesdayToday, getRemainingDealQty } from "@/lib/wednesdayDeals";
import type { OrderStatus } from "@/generated/prisma/client";

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
}

export async function placeOrder(
  lines: CartLine[],
  notes?: string,
): Promise<{ ok: boolean; error?: string; orderId?: string }> {
  const session = await assertStoreSession();
  const db = getOrgScopedDb(session.orgId);

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

  // Prices are always taken from the current catalog on the server — never
  // trust a client-submitted price. A clearance/deal line only gets the
  // special rate if the deal it points at is still live AND actually names
  // this same product — otherwise a client could pair a cheap deal's id
  // with an unrelated, expensive product to buy it at the wrong price.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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
        : Number(product.price);

    return {
      productId: product.id,
      productName: product.name,
      unitPrice,
      quantity: l.quantity,
      lineTotal: unitPrice * l.quantity,
      dealId: weeklyDealIsValid ? l.dealId : undefined,
    };
  });
  const totalAmount = orderLines.reduce((sum, l) => sum + l.lineTotal, 0);

  const order = await db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orgId: session.orgId,
        storeId: session.storeId,
        totalAmount,
        notes: notes?.trim() || undefined,
      },
    });
    await tx.orderItem.createMany({
      data: orderLines.map((l) => ({ orgId: session.orgId, orderId: order.id, ...l })),
    });
    return order;
  });

  revalidatePath("/shop/orders");
  revalidatePath("/team/admin/orders");

  // Best-effort — a failed/misconfigured email send must never block the
  // order itself, which is already committed above.
  const orderingStore = await db.store.findUnique({
    where: { id: session.storeId },
    select: { orderGiverWhatsapp: true },
  });
  sendOrderNotificationEmail({
    orderId: order.id,
    storeName: session.storeName ?? "Retailer",
    orderGiverWhatsapp: orderingStore?.orderGiverWhatsapp,
    totalAmount,
    notes: notes?.trim() || undefined,
    lines: orderLines.map((l) => ({
      productName: l.productName,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    })),
  }).catch(() => {});

  return { ok: true, orderId: order.id };
}

export interface ReorderLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
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

  const productIds = order.items.map((i) => i.productId);
  const products = await db.product.findMany({ where: { id: { in: productIds }, active: true } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const lines: ReorderLine[] = [];
  const unavailable: string[] = [];
  // Re-priced from the current catalog, never the order's old snapshot —
  // the same rule placeOrder uses when the cart is actually submitted.
  for (const item of order.items) {
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

  if (lines.length === 0) {
    return { ok: false, error: "None of the items in this order are available anymore." };
  }

  return { ok: true, lines, unavailable };
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
    db.purchaseHistoryItem.groupBy({
      by: ["itemName"],
      where: { storeId: session.storeId },
      _sum: { quantity: true, totalValue: true },
      orderBy: { _sum: { totalValue: "desc" } },
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
    body: `${orderStatusLabel("mr", status)} — ₹${Number(order.totalAmount).toLocaleString("en-IN")}`,
    url: `/shop/orders/${order.id}`,
  }).catch(() => {});
}
