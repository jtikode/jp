"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertStoreSession } from "@/lib/retailerPermissions";

export interface OrderGiverState {
  ok: boolean;
  error?: string;
}

const schema = z.object({
  orderGiverWhatsapp: z.string().trim().min(10, "Enter a valid WhatsApp number."),
});

export async function saveOrderGiverWhatsapp(
  _prev: OrderGiverState,
  formData: FormData,
): Promise<OrderGiverState> {
  const session = await assertStoreSession();
  const parsed = schema.safeParse({ orderGiverWhatsapp: formData.get("orderGiverWhatsapp") });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid WhatsApp number." };
  }

  const db = getOrgScopedDb(session.orgId);
  await db.store.update({
    where: { id: session.storeId },
    data: { orderGiverWhatsapp: parsed.data.orderGiverWhatsapp },
  });

  redirect("/shop/home");
}
