"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/permissions";
import { telecallerLogSchema } from "@/lib/validators";
import type { ActionResult } from "@/actions/employeeActions";

export async function logTelecallerContact(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertRole(["TELECALLER"]);

  const parsed = telecallerLogSchema.safeParse({
    storeId: formData.get("storeId"),
    orderAmount: formData.get("orderAmount"),
    paymentPromise: formData.get("paymentPromise"),
    collectionAmount: formData.get("collectionAmount"),
    hasOrder: formData.get("hasOrder"),
    noOrderReason: formData.get("noOrderReason"),
    noPaymentReason: formData.get("noPaymentReason"),
    complaintNotes: formData.get("complaintNotes"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the details." };
  }

  await db.telecallerLog.create({
    data: {
      userId: session.userId as string,
      storeId: parsed.data.storeId,
      orderAmount: parsed.data.orderAmount,
      paymentPromise: parsed.data.paymentPromise,
      collectionAmount: parsed.data.collectionAmount,
      hasOrder: parsed.data.hasOrder,
      noOrderReason: parsed.data.hasOrder ? undefined : parsed.data.noOrderReason,
      noPaymentReason: parsed.data.noPaymentReason,
      complaintNotes: parsed.data.complaintNotes,
    },
  });

  redirect("/telecaller/dashboard?logged=1");
}
