import { requireRole } from "@/lib/permissions";
import { AppHeader } from "@/components/AppHeader";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["ADMIN"]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <AppHeader title="Admin Dashboard" name={session.name ?? ""} />
      <AdminNav />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
