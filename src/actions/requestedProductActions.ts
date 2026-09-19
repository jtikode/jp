"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { assertStoreSession } from "@/lib/retailerPermissions";
import { sendProductRequestEmail } from "@/lib/productRequestEmail";

export async function requestProduct(
  _prevState: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await assertStoreSession();
  const db = getOrgScopedDb(session.orgId);

  const productName = (formData.get("productName") as string | null)?.trim();
  const company = (formData.get("company") as string | null)?.trim();
  const note = (formData.get("note") as string | null)?.trim() || undefined;

  if (!productName) {
    return { ok: false, error: "Product name is required." };
  }
  if (!company) {
    return { ok: false, error: "Company name is required." };
  }

  await db.requestedProduct.create({
    data: { orgId: session.orgId, storeId: session.storeId, productName, company, note },
  });

  revalidatePath("/team/admin/requested-products");

  // Best-effort — the request is already saved (and listed on the admin
  // Requested Products page), so an email failure must not fail the retailer's
  // submit.
  const store = await db.store.findUnique({
    where: { id: session.storeId },
    select: { orderGiverWhatsapp: true },
  });
  sendProductRequestEmail({
    storeName: session.storeName ?? "Retailer",
    storeWhatsapp: store?.orderGiverWhatsapp,
    productName,
    company,
    note,
  }).catch((err) => {
    console.error("sendProductRequestEmail failed for", productName, err);
  });

  return { ok: true };
}

export async function toggleRequestedProductReviewed(
  requestId: string,
  reviewed: boolean,
): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.requestedProduct.update({ where: { id: requestId }, data: { reviewed } });

  revalidatePath("/team/admin/requested-products");
}
