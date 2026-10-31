"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getRetailerSession } from "@/lib/retailerSession";
import { assertRole } from "@/lib/permissions";
import { sendOrderNotificationEmail } from "@/lib/orderEmail";
import { getStartOfIstDayUtc } from "@/lib/istTime";
import { loadCnfCatalog } from "@/lib/cnf/catalog";
import { CNF_MAX_PERCENT, CNF_MIN_ORDER_VALUE, CNF_NOTE_PREFIX } from "@/lib/cnf/config";
import { Prisma } from "@/generated/prisma/client";

export interface CnfIdentity {
  orgId: string;
  storeId: string;
  name: string;
  percent: number;
}

/** The distributor signed in on this device, or null (not signed in, or not a distributor). */
export async function getCnfIdentity(): Promise<CnfIdentity | null> {
  const session = await getRetailerSession();
  if (!session.storeId || !session.orgId) return null;
  const db = getOrgScopedDb(session.orgId);
  const store = await db.store.findUnique({
    where: { id: session.storeId },
    select: { name: true, distributorRatePercent: true },
  });
  const percent = store?.distributorRatePercent != null ? Number(store.distributorRatePercent) : 0;
  if (!store || percent <= 0) return null;
  return { orgId: session.orgId, storeId: session.storeId, name: store.name, percent };
}

const orderSchema = z.object({
  lines: z
    .array(z.object({ productId: z.string().min(1).max(60), qty: z.number().int().min(1).max(1_000_000) }))
    .min(1)
    .max(300),
  notes: z.string().max(500).optional(),
  clientRequestId: z.string().max(80).optional(),
});

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function placeCnfOrder(
  input: z.input<typeof orderSchema>,
): Promise<{ ok: boolean; error?: string; orderId?: string; orderNumber?: number }> {
  const me = await getCnfIdentity();
  if (!me) return { ok: false, error: "Please sign in again." };

  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Your cart is empty or has an invalid item." };
  const { notes, clientRequestId } = parsed.data;

  const db = getOrgScopedDb(me.orgId);

  if (clientRequestId) {
    const dup = await db.order.findFirst({ where: { clientRequestId } });
    if (dup) return { ok: true, orderId: dup.id, orderNumber: dup.orderNumber };
  }

  // Quantities are merged per product; every price is re-worked here from the
  // stored rates, never taken from what the browser showed.
  const qtyById = new Map<string, number>();
  for (const l of parsed.data.lines) qtyById.set(l.productId, (qtyById.get(l.productId) ?? 0) + l.qty);

  const catalog = await loadCnfCatalog(me.orgId, me.percent);
  const byId = new Map(catalog.map((p) => [p.id, p]));
  if ([...qtyById.keys()].some((id) => !byId.has(id))) {
    return { ok: false, error: "Some items in your cart are no longer available. Please refresh and try again." };
  }

  const orderLines = [...qtyById].map(([productId, quantity]) => {
    const p = byId.get(productId)!;
    return { productId, productName: p.name, unitPrice: p.price, quantity, lineTotal: round2(p.price * quantity) };
  });
  const totalAmount = round2(orderLines.reduce((sum, l) => sum + l.lineTotal, 0));

  if (CNF_MIN_ORDER_VALUE > 0 && totalAmount < CNF_MIN_ORDER_VALUE) {
    return { ok: false, error: `The minimum order is ₹${CNF_MIN_ORDER_VALUE.toLocaleString("en-IN")}. Your cart is ₹${totalAmount.toLocaleString("en-IN")}.` };
  }

  const store = await db.store.findUnique({
    where: { id: me.storeId },
    select: { name: true, externalCode: true, address: true, orderGiverWhatsapp: true },
  });

  const finalNotes = [CNF_NOTE_PREFIX, notes?.trim()].filter(Boolean).join("\n");

  let order;
  try {
    order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: { orgId: me.orgId, storeId: me.storeId, totalAmount, notes: finalNotes, clientRequestId },
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

  revalidatePath("/team/admin/orders");
  revalidatePath("/cnf/orders");

  const ordersTodayCount = await db.order.count({ where: { storeId: me.storeId, createdAt: { gte: getStartOfIstDayUtc() } } });
  sendOrderNotificationEmail({
    orderNumber: order.orderNumber,
    storeName: store?.name ?? me.name,
    storeCode: store?.externalCode,
    storeAddress: store?.address,
    orderGiverWhatsapp: store?.orderGiverWhatsapp,
    ordersTodayCount,
    totalAmount,
    notes: finalNotes,
    lines: orderLines,
  })
    .then(() => db.order.update({ where: { id: order.id }, data: { emailSentAt: new Date() } }))
    .catch((err) => console.error("sendOrderNotificationEmail failed for CNF order", order.id, err));

  return { ok: true, orderId: order.id, orderNumber: order.orderNumber };
}

// ---- Admin: which stores are distributors, and what percentage they pay ----

export interface DistributorShop {
  id: string;
  name: string;
  code: string | null;
  address: string;
  percent: number;
}

export async function listDistributors(): Promise<DistributorShop[]> {
  const me = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(me.orgId);
  const stores = await db.store.findMany({
    where: { distributorRatePercent: { not: null } },
    select: { id: true, name: true, externalCode: true, address: true, distributorRatePercent: true },
    orderBy: { name: "asc" },
  });
  return stores.map((s) => ({ id: s.id, name: s.name, code: s.externalCode, address: s.address, percent: Number(s.distributorRatePercent) }));
}

/** Gives the chosen stores access to cnf.jpkop.in at purchase rate + percent. */
export async function applyDistributorRate(storeIds: string[], percent: number): Promise<{ ok: boolean; error?: string; updated?: number }> {
  const me = await assertRole(["ADMIN"]);
  if (!Number.isFinite(percent) || percent <= 0 || percent > CNF_MAX_PERCENT) {
    return { ok: false, error: `Enter a percentage between 0 and ${CNF_MAX_PERCENT}.` };
  }
  const ids = [...new Set(storeIds)].slice(0, 500);
  if (ids.length === 0) return { ok: false, error: "Pick at least one store." };
  const db = getOrgScopedDb(me.orgId);
  const res = await db.store.updateMany({ where: { id: { in: ids } }, data: { distributorRatePercent: percent } });
  revalidatePath("/team/admin/distributors");
  return { ok: true, updated: res.count };
}

export async function removeDistributor(storeId: string): Promise<{ ok: boolean }> {
  const me = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(me.orgId);
  await db.store.updateMany({ where: { id: storeId }, data: { distributorRatePercent: null } });
  revalidatePath("/team/admin/distributors");
  return { ok: true };
}
