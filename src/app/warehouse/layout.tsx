import { requireRole } from "@/lib/permissions";
import { AppHeader } from "@/components/AppHeader";
import { WarehouseNav } from "@/components/warehouse/WarehouseNav";

export const dynamic = "force-dynamic";

export default async function WarehouseLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["WAREHOUSE"]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <AppHeader title="Warehouse" name={session.name ?? ""} />
      <WarehouseNav />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
