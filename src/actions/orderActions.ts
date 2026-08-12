"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertStoreSession } from "@/lib/retailerPermissions";
import { assertRole } from "@/lib/permissions";
import { sendPushToStore } from "@/lib/webPush";
import { orderStatusLabel } from "@/lib/i18n";
import type { OrderStatus } from "@/generated/prisma/client";

export interface CartLine {
  productId: string;
  quantity: number;
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

  // Prices are always taken from the current catalog on the server — never
  // trust a client-submitted price.
  const orderLines = cleanLines.map((l) => {
    const product = productMap.get(l.productId)!;
    const unitPrice = Number(product.price);
    return {
      productId: product.id,
      productName: product.name,
      unitPrice,
      quantity: l.quantity,
      lineTotal: unitPrice * l.quantity,
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
  revalidatePath("/admin/orders");
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

function normalizeName(name: string): string {
  return name.trim().toUpperCase().replace(/\s+/g, " ");
}

// Combines two sources of "what this retailer regularly needs": their own
// past in-app orders (a direct productId link) and admin-uploaded historical
// purchase data (free-text item names, matched against the catalog by exact
// normalized name — the same conservative match used for the stock import,
// since a wrong match here would add the wrong product to someone's order).
export async function getFastOrderItems(): Promise<FastOrderItem[]> {
  const session = await assertStoreSession();
  const db = getOrgScopedDb(session.orgId);

  const [orderedGroups, historyGroups, products] = await Promise.all([
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
    db.product.findMany({ where: { active: true } }),
  ]);

  const productById = new Map(products.map((p) => [p.id, p]));
  const productByNormalizedName = new Map(products.map((p) => [normalizeName(p.name), p]));

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
      unitPrice: Number(product.price),
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
      unitPrice: Number(product.price),
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

  revalidatePath("/admin/orders");

  // Best-effort — a retailer with no push subscription (or a push-service
  // hiccup) must never block the admin from updating an order's status.
  // No stored language preference per store, so this defaults to the
  // project's default language (Marathi) same as a fresh, unconfigured session.
  sendPushToStore(session.orgId, order.storeId, {
    title: "MedPoint",
    body: `${orderStatusLabel("mr", status)} — ₹${Number(order.totalAmount).toLocaleString("en-IN")}`,
    url: `/shop/orders/${order.id}`,
  }).catch(() => {});
}
