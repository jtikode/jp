"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { assertStoreSession } from "@/lib/retailerPermissions";

const MAX_INVOICES = 60;
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

/**
 * Called from the shop's Pay Online page when the retailer says they've paid.
 * UPI settles outside the app, so this is a retailer-reported record — an
 * admin marks it verified after matching the bank statement.
 */
export async function reportPayment(
  amount: number,
  invoiceNos: string[],
  utr?: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await assertStoreSession();
  const db = getOrgScopedDb(session.orgId);

  const rounded = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(rounded) || rounded <= 0) {
    return { ok: false, error: "Enter a valid amount." };
  }

  const cleanInvoices = [...new Set(invoiceNos.map((n) => String(n).trim().slice(0, 40)).filter(Boolean))].slice(
    0,
    MAX_INVOICES,
  );
  const cleanUtr = utr?.trim().slice(0, 40) || undefined;

  // A double tap or a retry after a dropped connection must not file the
  // same payment twice.
  const recentSame = await db.paymentReport.findFirst({
    where: {
      storeId: session.storeId,
      amount: rounded,
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
  });
  if (recentSame && [...recentSame.invoiceNos].sort().join("|") === [...cleanInvoices].sort().join("|")) {
    return { ok: true };
  }

  await db.paymentReport.create({
    data: {
      orgId: session.orgId,
      storeId: session.storeId,
      amount: rounded,
      invoiceNos: cleanInvoices,
      utr: cleanUtr,
    },
  });

  revalidatePath("/team/admin/payments");
  return { ok: true };
}

export async function setPaymentVerified(paymentId: string, verified: boolean): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.paymentReport.update({
    where: { id: paymentId },
    data: { verified, verifiedAt: verified ? new Date() : null },
  });

  revalidatePath("/team/admin/payments");
}
