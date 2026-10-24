import { requireRole } from "@/lib/permissions";
import { ImportsPanel } from "@/components/admin/ImportsPanel";

export default async function ImportsPage() {
  const session = await requireRole(["ADMIN"]);
  return <ImportsPanel orgId={session.orgId} />;
}
