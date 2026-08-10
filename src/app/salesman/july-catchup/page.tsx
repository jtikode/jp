import { format, eachDayOfInterval } from "date-fns";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { BackfillGrid } from "@/components/salesman/BackfillGrid";

export default async function JulyCatchupPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>;
}) {
  const { storeId } = await searchParams;
  const session = await getSession();
  const userId = session.userId as string;
  const db = getOrgScopedDb(session.orgId as string);
  const lang = await getLang();

  const assignments = await db.routeAssignment.findMany({
    where: { userId },
    select: { routeId: true },
  });
  const routeIds = assignments.map((a) => a.routeId);

  const stores = await db.store.findMany({
    where: routeIds.length > 0 ? { routeId: { in: routeIds } } : {},
    orderBy: { name: "asc" },
  });

  const year = new Date().getFullYear();
  const days = eachDayOfInterval({ start: new Date(year, 6, 1), end: new Date(year, 6, 31) });

  let dayInfos: { date: string; dayOfWeek: number; existing?: { orderAmount: number | null; collectionAmount: number | null } }[] = [];

  if (storeId) {
    const monthStart = new Date(year, 6, 1);
    const monthEnd = new Date(year, 6, 31, 23, 59, 59, 999);
    const existingVisits = await db.visit.findMany({
      where: { userId, storeId, visitDate: { gte: monthStart, lte: monthEnd } },
      orderBy: { visitDate: "asc" },
    });
    const existingByDate = new Map(
      existingVisits.map((v) => [
        format(v.visitDate, "yyyy-MM-dd"),
        {
          orderAmount: v.orderAmount != null ? Number(v.orderAmount) : null,
          collectionAmount: v.collectionAmount != null ? Number(v.collectionAmount) : null,
        },
      ]),
    );

    dayInfos = days.map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      return {
        date: dateStr,
        dayOfWeek: d.getDay(),
        existing: existingByDate.get(dateStr),
      };
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "catchup_heading")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t(lang, "catchup_subtitle")}</p>
      </Card>

      <Card>
        <form className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-600">{t(lang, "choose_a_store")}</label>
            <Select name="storeId" defaultValue={storeId ?? ""} className="min-h-11 w-full text-sm">
              <option value="" disabled>
                {t(lang, "choose_a_store")}
              </option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="min-h-11 py-2 text-sm">
            {t(lang, "go")}
          </Button>
        </form>
      </Card>

      {storeId && <BackfillGrid lang={lang} storeId={storeId} days={dayInfos} />}
    </div>
  );
}
