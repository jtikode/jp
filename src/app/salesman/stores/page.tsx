import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { StoreSearchList } from "@/components/salesman/StoreSearchList";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";

export default async function SalesmanStoresPage() {
  const session = await getSession();
  const db = getOrgScopedDb(session.orgId as string);
  const lang = await getLang();

  const assignments = await db.routeAssignment.findMany({
    where: { userId: session.userId },
    select: { routeId: true },
  });
  const routeIds = assignments.map((a) => a.routeId);

  const stores = await db.store.findMany({
    where: routeIds.length > 0 ? { routeId: { in: routeIds } } : {},
    include: { route: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-bold text-slate-900">{t(lang, "chemist_list")}</h1>
      <StoreSearchList
        lang={lang}
        stores={stores.map((s) => ({
          id: s.id,
          name: s.name,
          externalCode: s.externalCode,
          address: s.address,
          routeName: s.route?.name,
          latitude: s.latitude,
          longitude: s.longitude,
        }))}
      />
    </div>
  );
}
