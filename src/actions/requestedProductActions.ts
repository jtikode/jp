"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { assertStoreSession } from "@/lib/retailerPermissions";

export async function requestProduct(
  _prevState: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await assertStoreSession();
  const db = getOrgScopedDb(session.orgId);

  const productName = (formData.get("productName") as string | null)?.trim();
  const note = (formData.get("note") as string | null)?.trim() || undefined;

  if (!productName) {
    return { ok: false, error: "Product name is required." };
  }

  await db.requestedProduct.create({
    data: { orgId: session.orgId, storeId: session.storeId, productName, note },
  });

  revalidatePath("/team/admin/requested-products");
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
