import { db } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { UpiSettingsForm } from "@/components/admin/UpiSettingsForm";

export default async function AdminSettingsPage() {
  const session = await requireRole(["ADMIN"]);

  // Organization isn't a tenant-scoped model — read directly by id.
  const org = await db.organization.findUniqueOrThrow({ where: { id: session.orgId } });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Pay Online (UPI)</h2>
        <UpiSettingsForm
          defaults={{ upiVpa: org.upiVpa ?? "", upiPayeeName: org.upiPayeeName ?? "" }}
        />
      </Card>
    </div>
  );
}
