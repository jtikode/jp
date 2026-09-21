import { z } from "zod";
import { apiHandler } from "@/lib/apiHandler";
import { assertStoreSession } from "@/lib/retailerPermissions";
import { getOrgScopedDb } from "@/lib/orgScopedDb";

const schema = z.object({ orderGiverWhatsapp: z.string().trim().min(10, "Enter a valid WhatsApp number.") });

export function POST(request: Request) {
  return apiHandler(async () => {
    const session = await assertStoreSession();
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid WhatsApp number." };
    await getOrgScopedDb(session.orgId).store.update({
      where: { id: session.storeId },
      data: { orderGiverWhatsapp: parsed.data.orderGiverWhatsapp },
    });
    return { ok: true };
  });
}
