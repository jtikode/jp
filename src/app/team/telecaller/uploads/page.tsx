import { requireRole } from "@/lib/permissions";
import { ImportsPanel } from "@/components/admin/ImportsPanel";

// Telecallers upload the outstanding, stock and rate files themselves, so they
// get the same upload forms the admin has.
export default async function TelecallerUploadsPage() {
  const session = await requireRole(["TELECALLER"]);
  return <ImportsPanel orgId={session.orgId} />;
}
