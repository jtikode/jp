import { requireRole } from "@/lib/permissions";
import { listDistributors } from "@/actions/cnfActions";
import { DistributorsManager } from "@/components/admin/DistributorsManager";

export const dynamic = "force-dynamic";

export default async function DistributorsPage() {
  await requireRole(["ADMIN"]);
  const current = await listDistributors();
  return (
    <div className="mx-auto max-w-3xl">
      <DistributorsManager current={current} />
    </div>
  );
}
