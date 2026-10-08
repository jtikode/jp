"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOrgScopedDb, type OrgScopedDb } from "@/lib/orgScopedDb";
import { getRetailerSession } from "@/lib/retailerSession";
import { getSession } from "@/lib/session";
import { sendOrderNotificationEmail } from "@/lib/orderEmail";
import { getStartOfIstDayUtc } from "@/lib/istTime";
import { Prisma } from "@/generated/prisma/client";
import { CIPLA_OTC_NOTE_PREFIX, currentOtcSheet, evaluateCart, findSku, inr, round2 } from "@/lib/ciplaOtc";
import type { OtcSheet } from "@/lib/ciplaOtc";

const STAFF_ROLES = ["SALESMAN", "TELECALLER", "ADMIN"] as const;

export type CiplaIdentity =
  | { kind: "retailer"; orgId: string; storeId: string; name: string }
  | { kind: "staff"; orgId: string; userId: string; name: string; role: string };

/** Who is signed in on this device: a retailer, a staff member, or nobody. */
export async function getCiplaIdentity(): Promise<CiplaIdentity | null> {
  const retailer = await getRetailerSession();
  if (retailer.storeId && retailer.orgId) {
    return { kind: "retailer", orgId: retailer.orgId, storeId: retailer.storeId, name: retailer.storeName ?? "Retailer" };
  }
  const staff = await getSession();
  if (staff.userId && staff.orgId && staff.role && (STAFF_ROLES as readonly string[]).includes(staff.role)) {
    return { kind: "staff", orgId: staff.orgId, userId: staff.userId, name: staff.name ?? "Staff", role: staff.role };
  }
  return null;
}

export interface CiplaStoreOption {
  id: string;
  name: string;
  address: string;
  code: string | null;
}

/** Staff-only lookup behind the "pick the retailer" box when booking for a shop. */
export async function searchCiplaStores(query: string): Promise<CiplaStoreOption[]> {
  const me = await getCiplaIdentity();
  if (!me || me.kind !== "staff") return [];
  const q = query.trim();
  if (q.length < 2) return [];
  const db = getOrgScopedDb(me.orgId);
  const stores = await db.store.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { externalCode: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    },
    select: { id: true, name: true, address: true, externalCode: true },
    orderBy: { name: "asc" },
    take: 15,
  });
  return stores.map((s) => ({ id: s.id, name: s.name, address: s.address, code: s.externalCode }));
}

const orderSchema = z.object({
  lines: z
    .array(
      z.object({
        skuId: z.string().min(1).max(60),
        priceIdx: z.number().int().min(0).max(10),
        option: z.string().max(20).optional(),
        qty: z.number().int().min(1).max(100000),
      }),
    )
    .min(1)
    .max(300),
  storeId: z.string().optional(),
  notes: z.string().max(500).optional(),
  clientRequestId: z.string().max(80).optional(),
});

function productNameFor(sheet: OtcSheet, skuId: string, priceIdx: number, option?: string): string {
  const hit = findSku(sheet, skuId);
  if (!hit) return skuId;
  const mrp = hit.sku.prices[priceIdx]?.mrp;
  const batch = hit.sku.prices.length > 1 && mrp != null ? ` MRP ${mrp}` : "";
  return `CIPLA OTC ${hit.sku.name}${option ? ` ${option}` : ""}${batch}`.slice(0, 190);
}

// Cipla OTC items are not in the distributor's product list, but every order
// line must point at a product. They live as hidden products (never shown on
// the shop) created the first time an item is ordered and re-priced each time.
async function ensureProduct(db: OrgScopedDb, orgId: string, name: string, price: number, mrp: number | null): Promise<string> {
  const existing = await db.product.findFirst({ where: { name }, select: { id: true } });
  if (existing) {
    await db.product.update({ where: { id: existing.id }, data: { price, mrp } });
    return existing.id;
  }
  try {
    const created = await db.product.create({
      data: { orgId, name, company: "Cipla OTC", price, mrp, active: false, onRequest: true },
      select: { id: true },
    });
    return created.id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const again = await db.product.findFirst({ where: { name }, select: { id: true } });
      if (again) return again.id;
    }
    throw err;
  }
}

export async function placeCiplaOtcOrder(
  input: z.input<typeof orderSchema>,
): Promise<{ ok: boolean; error?: string; orderId?: string; orderNumber?: number }> {
  const me = await getCiplaIdentity();
  if (!me) return { ok: false, error: "Please sign in again." };

  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Your cart is empty or has an invalid item." };
  const { lines, notes, clientRequestId } = parsed.data;

  const db = getOrgScopedDb(me.orgId);

  if (clientRequestId) {
    const dup = await db.order.findFirst({ where: { clientRequestId } });
    if (dup) return { ok: true, orderId: dup.id, orderNumber: dup.orderNumber };
  }

  let storeId: string;
  if (me.kind === "retailer") {
    storeId = me.storeId;
  } else {
    if (!parsed.data.storeId) return { ok: false, error: "Pick the retailer this order is for." };
    const store = await db.store.findFirst({ where: { id: parsed.data.storeId }, select: { id: true } });
    if (!store) return { ok: false, error: "That retailer was not found." };
    storeId = store.id;
  }
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { name: true, externalCode: true, address: true, orderGiverWhatsapp: true },
  });

  // Every rate, scheme and free unit is worked out here from the stored sheet,
  // never taken from what the browser displayed.
  const sheet = currentOtcSheet();
  const result = evaluateCart(sheet, lines);
  if (result.lines.length === 0) return { ok: false, error: "None of the items in your cart are on the current rate sheet." };

  const orderLines: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    scheme?: string;
  }[] = [];

  for (const l of result.lines) {
    const hit = findSku(sheet, l.skuId)!;
    const name = productNameFor(sheet, l.skuId, l.priceIdx, l.option);
    const productId = await ensureProduct(db, me.orgId, name, l.unit, hit.sku.prices[l.priceIdx].mrp);
    const bits: string[] = [];
    if (l.freeQty > 0) bits.push(`${l.freeQty} free included`);
    if (l.discount > 0) bits.push(`scheme discount ${inr(l.discount)}`);
    orderLines.push({
      productId,
      productName: name,
      unitPrice: l.unit,
      quantity: l.qty + l.freeQty,
      lineTotal: l.lineTotal,
      scheme: bits.length ? bits.join(", ") : undefined,
    });
  }
  for (const f of result.freeLines) {
    const name = f.skuId
      ? productNameFor(sheet, f.skuId, f.priceIdx)
      : `CIPLA OTC FREE ${f.name}`.slice(0, 190);
    const hit = f.skuId ? findSku(sheet, f.skuId) : null;
    const productId = await ensureProduct(db, me.orgId, name, 0, hit?.sku.prices[f.priceIdx]?.mrp ?? null);
    orderLines.push({ productId, productName: name, unitPrice: 0, quantity: f.qty, lineTotal: 0, scheme: `FREE: ${f.label}` });
  }

  const totalAmount = round2(result.total);
  const header = `${CIPLA_OTC_NOTE_PREFIX} · ${sheet.label}`;
  const finalNotes = [
    header,
    me.kind === "staff" ? `Booked by ${me.name} (${me.role.toLowerCase()}) for ${store?.name ?? "retailer"}` : undefined,
    result.applied.length ? `Schemes applied:\n${result.applied.map((a) => `- ${a.label}${a.amount ? ` (${inr(a.amount)} off)` : ""}`).join("\n")}` : undefined,
    result.gifts.length ? `Gifts earned:\n${result.gifts.map((g) => `- ${g.text}`).join("\n")}` : undefined,
    notes?.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  let order;
  try {
    order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: { orgId: me.orgId, storeId, totalAmount, notes: finalNotes, clientRequestId },
      });
      await tx.orderItem.createMany({
        data: orderLines.map((l) => ({ orgId: me.orgId, orderId: created.id, ...l })),
      });
      return created;
    });
  } catch (err) {
    if (clientRequestId && err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const dup = await db.order.findFirst({ where: { clientRequestId } });
      if (dup) return { ok: true, orderId: dup.id, orderNumber: dup.orderNumber };
    }
    throw err;
  }

  revalidatePath("/shop/orders");
  revalidatePath("/team/admin/orders");
  revalidatePath("/cipla/orders");

  const ordersTodayCount = await db.order.count({ where: { storeId, createdAt: { gte: getStartOfIstDayUtc() } } });
  sendOrderNotificationEmail({
    orderNumber: order.orderNumber,
    storeName: store?.name ?? "Retailer",
    storeCode: store?.externalCode,
    storeAddress: store?.address,
    orderGiverWhatsapp: store?.orderGiverWhatsapp,
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
    .catch((err) => console.error("sendOrderNotificationEmail failed for Cipla OTC order", order.id, err));

  return { ok: true, orderId: order.id, orderNumber: order.orderNumber };
}
