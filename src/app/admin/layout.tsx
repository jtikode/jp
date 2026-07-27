import { requireRole } from "@/lib/permissions";
import { AppHeader } from "@/components/AppHeader";
import { AdminNav } from "@/components/admin/AdminNav";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["ADMIN"]);
  const lang = await getLang();

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <AppHeader title="Admin Dashboard" name={session.name ?? ""} lang={lang} logOutLabel={t(lang, "log_out")} />
      <AdminNav />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
