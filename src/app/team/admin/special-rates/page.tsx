import { requireRole } from "@/lib/permissions";
import { listSpecialShops } from "@/actions/specialRateActions";
import { SpecialRatesManager } from "@/components/admin/SpecialRatesManager";

export const dynamic = "force-dynamic";

export default async function SpecialRatesPage() {
  await requireRole(["ADMIN"]);
  const current = await listSpecialShops();
  return (
    <div className="mx-auto max-w-3xl">
      <SpecialRatesManager current={current} />
    </div>
  );
}
