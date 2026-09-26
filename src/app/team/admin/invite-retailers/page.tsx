import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { InviteSendList, type InviteRow } from "@/components/admin/InviteSendList";
import { shopLoginPassword } from "@/lib/shopLoginCode";
import { normalizeMobile } from "@/lib/inviteMessage";

export default async function InviteRetailersPage() {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const [stores, assignments] = await Promise.all([
    db.store.findMany({
      where: { loginCode: { not: null }, phone: { not: null } },
      select: {
        id: true,
        name: true,
        loginCode: true,
        phone: true,
        lastLoginAt: true,
        routeId: true,
        route: { select: { name: true } },
      },
      orderBy: [{ route: { name: "asc" } }, { visitSequence: "asc" }],
    }),
    db.routeAssignment.findMany({
      select: { routeId: true, user: { select: { name: true, role: true } } },
    }),
  ]);

  const salesmenByRoute = new Map<string, string[]>();
  for (const a of assignments) {
    if (a.user.role !== "SALESMAN") continue;
    const list = salesmenByRoute.get(a.routeId) ?? [];
    list.push(a.user.name);
    salesmenByRoute.set(a.routeId, list);
  }

  const rows: InviteRow[] = [];
  let noMobile = 0;
  for (const s of stores) {
    const whatsapp = normalizeMobile(s.phone);
    if (!whatsapp) {
      noMobile += 1;
      continue;
    }
    rows.push({
      id: s.id,
      name: s.name,
      loginCode: s.loginCode as string,
      password: shopLoginPassword(s.loginCode as string),
      whatsapp,
      phone: whatsapp.slice(2),
      route: s.route?.name ?? "No Route Assigned",
      salesmen: ((s.routeId && salesmenByRoute.get(s.routeId)) || []).join(", "),
      loggedIn: s.lastLoginAt !== null,
    });
  }

  const notYet = rows.filter((r) => !r.loggedIn).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card>
        <h1 className="mb-1 text-lg font-bold text-slate-900">Invite Retailers on WhatsApp</h1>
        <p className="mb-2 text-sm text-slate-500">
          One tap opens WhatsApp with the store&apos;s name, app link, Login ID and password already
          written. Press send there, then come back and tap the next one. Each message goes from your
          own WhatsApp, so send in small batches through the day.
        </p>
        <p className="text-sm text-slate-700">
          <span className="font-semibold tabular-nums">{rows.length}</span> stores have a WhatsApp-able
          mobile number, <span className="font-semibold tabular-nums">{notYet}</span> of them have never
          logged in. <span className="tabular-nums">{noMobile}</span> more only have a landline or an
          invalid number and are left out.
        </p>
      </Card>

      <Card>
        <InviteSendList rows={rows} />
      </Card>
    </div>
  );
}
