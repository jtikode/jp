"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertStoreSession } from "@/lib/retailerPermissions";
import { assertRole } from "@/lib/permissions";
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

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.order.update({ where: { id: orderId }, data: { status } });

  revalidatePath("/admin/orders");
}
