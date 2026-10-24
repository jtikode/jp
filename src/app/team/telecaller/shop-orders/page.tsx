import { requireRole } from "@/lib/permissions";
import { OrdersPanel } from "@/components/admin/OrdersPanel";

// Telecallers bill orders by hand, so they see every retailer order the way the
// admin does: today's by default, with the full history one switch away.
export default async function TelecallerShopOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; range?: string }>;
}) {
  const session = await requireRole(["TELECALLER"]);
  const { status, range } = await searchParams;

  return (
    <OrdersPanel orgId={session.orgId} status={status} range={range === "all" ? "all" : "today"} markSeen={false} />
  );
}
