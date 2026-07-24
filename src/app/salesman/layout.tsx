import { requireRole } from "@/lib/permissions";
import { AppHeader } from "@/components/AppHeader";
import { SalesmanNav } from "@/components/salesman/SalesmanNav";

export default async function SalesmanLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["SALESMAN"]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <AppHeader title="Field Terminal" name={session.name ?? ""} />
      <SalesmanNav />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
