"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import type { ActionResult } from "@/actions/employeeActions";

export async function createWednesdayDeal(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const productId = formData.get("productId") as string | null;
  const dealPrice = Number(formData.get("dealPrice"));
  const maxQtyPerStore = Number(formData.get("maxQtyPerStore"));

  if (!productId) return { ok: false, error: "Choose a product." };
  if (!Number.isFinite(dealPrice) || dealPrice <= 0) {
    return { ok: false, error: "Enter a valid deal price." };
  }
  if (!Number.isInteger(maxQtyPerStore) || maxQtyPerStore <= 0) {
    return { ok: false, error: "Enter a valid max quantity per retailer." };
  }

  const product = await db.product.findFirst({ where: { id: productId, active: true } });
  if (!product) return { ok: false, error: "That product isn't in the active catalog." };

  await db.wednesdayDeal.upsert({
    where: { productId },
    update: { dealPrice, maxQtyPerStore, active: true },
    create: { orgId: session.orgId, productId, dealPrice, maxQtyPerStore, active: true },
  });

  revalidatePath("/team/admin/wednesday-deals");
  revalidatePath("/shop/home");
  revalidatePath("/shop/products");
  return { ok: true };
}

export async function toggleWednesdayDealActive(dealId: string, active: boolean): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.wednesdayDeal.update({ where: { id: dealId }, data: { active } });

  revalidatePath("/team/admin/wednesday-deals");
  revalidatePath("/shop/home");
  revalidatePath("/shop/products");
}
