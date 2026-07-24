"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/permissions";
import { warehouseActionSchema } from "@/lib/validators";
import type { ActionResult } from "@/actions/employeeActions";

export async function logWarehouseAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertRole(["WAREHOUSE"]);

  const parsed = warehouseActionSchema.safeParse({
    taskType: formData.get("taskType"),
    referenceNo: formData.get("referenceNo"),
    itemDescription: formData.get("itemDescription"),
    quantity: formData.get("quantity"),
    rackLocation: formData.get("rackLocation"),
    hasDiscrepancy: formData.get("hasDiscrepancy"),
    discrepancyNotes: formData.get("discrepancyNotes"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the details." };
  }

  await db.warehouseAction.create({
    data: {
      userId: session.userId as string,
      taskType: parsed.data.taskType,
      referenceNo: parsed.data.referenceNo,
      itemDescription: parsed.data.itemDescription,
      quantity: parsed.data.quantity ? Math.trunc(parsed.data.quantity) : undefined,
      rackLocation: parsed.data.rackLocation,
      hasDiscrepancy: parsed.data.hasDiscrepancy,
      discrepancyNotes: parsed.data.hasDiscrepancy ? parsed.data.discrepancyNotes : undefined,
    },
  });

  const pathByType: Record<string, string> = {
    INWARD: "/warehouse/inward",
    SHELVING: "/warehouse/shelving",
    FULFILLMENT: "/warehouse/fulfillment",
  };
  revalidatePath(pathByType[parsed.data.taskType]);

  return { ok: true };
}
