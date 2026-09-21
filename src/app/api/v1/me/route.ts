import { apiHandler } from "@/lib/apiHandler";
import { assertStoreSession } from "@/lib/retailerPermissions";
import { getOrgScopedDb } from "@/lib/orgScopedDb";

export function GET() {
  return apiHandler(async () => {
    const session = await assertStoreSession();
    const store = await getOrgScopedDb(session.orgId).store.findUniqueOrThrow({ where: { id: session.storeId } });
    return { store: { id: store.id, name: store.name, needsWhatsapp: !store.orderGiverWhatsapp } };
  });
}
