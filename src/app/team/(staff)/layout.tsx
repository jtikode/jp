import { requireRole } from "@/lib/permissions";
import { AppHeader } from "@/components/AppHeader";
import { AdminNav } from "@/components/admin/AdminNav";
import { SalesmanNav } from "@/components/salesman/SalesmanNav";
import { TelecallerNav } from "@/components/telecaller/TelecallerNav";
import { WarehouseNav } from "@/components/warehouse/WarehouseNav";
import { TakeOrderButton } from "@/components/TakeOrderButton";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const TITLES = {
  ADMIN: "Admin Dashboard",
  SALESMAN: "Field Terminal",
  TELECALLER: "Telecaller Desk",
  WAREHOUSE: "Warehouse",
} as const;

// Pages every staff role can open (the task board, taking an order for a
// party) sit outside the role folders, so they get the signed-in role's own
// header and menu here instead of a bare page with no navigation.
export default async function StaffSharedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["ADMIN", "SALESMAN", "TELECALLER", "WAREHOUSE"]);
  const lang = await getLang();
  const canOrder = session.role === "ADMIN" || session.role === "SALESMAN";

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100">
      <AppHeader
        title={TITLES[session.role]}
        name={session.name ?? ""}
        lang={lang}
        logOutLabel={t(lang, "log_out")}
        extra={canOrder ? <TakeOrderButton /> : undefined}
      />
      {session.role === "ADMIN" && <AdminNav />}
      {session.role === "SALESMAN" && <SalesmanNav lang={lang} />}
      {session.role === "TELECALLER" && <TelecallerNav />}
      {session.role === "WAREHOUSE" && <WarehouseNav />}
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
