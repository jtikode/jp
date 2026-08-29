import { requireRole } from "@/lib/permissions";
import { AppHeader } from "@/components/AppHeader";
import { TelecallerNav } from "@/components/telecaller/TelecallerNav";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function TelecallerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["TELECALLER"]);
  const lang = await getLang();

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <AppHeader title="Telecaller Desk" name={session.name ?? ""} lang={lang} logOutLabel={t(lang, "log_out")} />
      <TelecallerNav />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
