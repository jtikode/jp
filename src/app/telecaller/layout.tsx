import { requireRole } from "@/lib/permissions";
import { AppHeader } from "@/components/AppHeader";

export const dynamic = "force-dynamic";

export default async function TelecallerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["TELECALLER"]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <AppHeader title="Telecaller Desk" name={session.name ?? ""} />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
