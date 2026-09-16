import { requireRole } from "@/lib/permissions";
import { AppHeader } from "@/components/AppHeader";
import { AdminNav } from "@/components/admin/AdminNav";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { getOrgScopedDb } from "@/lib/orgScopedDb";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["ADMIN"]);
  const lang = await getLang();
  const db = getOrgScopedDb(session.orgId);
  const unseenOrderCount = await db.order.count({ where: { adminSeenAt: null } });

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100">
      <AppHeader title="Admin Dashboard" name={session.name ?? ""} lang={lang} logOutLabel={t(lang, "log_out")} />
      <AdminNav unseenOrderCount={unseenOrderCount} />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
