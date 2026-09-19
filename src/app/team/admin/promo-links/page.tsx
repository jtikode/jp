import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
import { slugifyName } from "@/lib/promoSlug";
import { buildWhatsAppLink } from "@/lib/waLink";

const PROMO_HOST = "https://app.jpkop.in";

export default async function PromoLinksPage() {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const salesmen = await db.user.findMany({
    where: { role: "SALESMAN", active: true },
    orderBy: { name: "asc" },
  });

  // Lazily back-fill any salesman missing a promo slug — new hires and
  // anyone added before this feature shipped.
  const existingSlugs = new Set(salesmen.map((s) => s.promoSlug).filter((s): s is string => !!s));
  for (const salesman of salesmen) {
    if (salesman.promoSlug) continue;
    let slug = slugifyName(salesman.name);
    let suffix = 2;
    while (existingSlugs.has(slug)) {
      slug = `${slugifyName(salesman.name)}-${suffix}`;
      suffix += 1;
    }
    existingSlugs.add(slug);
    await db.user.update({ where: { id: salesman.id }, data: { promoSlug: slug } });
    salesman.promoSlug = slug;
  }

  const [clickCounts, lastClicks] = await Promise.all([
    db.promoClick.groupBy({ by: ["userId"], _count: { _all: true } }),
    db.promoClick.groupBy({ by: ["userId"], _max: { createdAt: true } }),
  ]);
  const countByUser = new Map(clickCounts.map((c) => [c.userId, c._count._all]));
  const lastClickByUser = new Map(lastClicks.map((c) => [c.userId, c._max.createdAt]));

  const rows = salesmen
    .map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.promoSlug as string,
      clicks: countByUser.get(s.id) ?? 0,
      lastClick: lastClickByUser.get(s.id) ?? null,
      phone: s.phone,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <h1 className="text-lg font-bold text-slate-900">Promo Links</h1>
        <p className="mt-1 text-sm text-slate-500">
          Each salesman gets a unique link ending in their own name. Share it however you like,
          WhatsApp, a poster, in person, and this page tracks how many times each one has been
          opened, so you can see who&apos;s actually driving retailers to the app.
        </p>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Rank</th>
              <th className="py-2 pr-4">Salesman</th>
              <th className="py-2 pr-4">Link</th>
              <th className="py-2 pr-4">Clicks</th>
              <th className="py-2 pr-4">Last Click</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const url = `${PROMO_HOST}/go/${r.slug}`;
              return (
                <tr key={r.id} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-4 font-semibold text-slate-900">
                    {i === 0 && r.clicks > 0 ? "🏆 " : ""}
                    {i + 1}
                  </td>
                  <td className="py-3 pr-4 font-medium text-slate-900">{r.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-blue-700">
                    /go/{r.slug}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-slate-900">{r.clicks}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {r.lastClick
                      ? r.lastClick.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <CopyLinkButton url={url} />
                      {r.phone && (
                        <a
                          href={buildWhatsAppLink(
                            r.phone,
                            `Hi ${r.name}, here's your personal link to promote the JP Traders shop app, every retailer who opens it gets counted under your name: ${url}`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-green-700 hover:underline"
                        >
                          Send on WhatsApp
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  No active salesmen yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
