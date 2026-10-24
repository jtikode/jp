import { requireRole } from "@/lib/permissions";
import { OrdersPanel } from "@/components/admin/OrdersPanel";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; range?: string }>;
}) {
  const session = await requireRole(["ADMIN"]);
  const { status, range } = await searchParams;

  return <OrdersPanel orgId={session.orgId} status={status} range={range === "today" ? "today" : "all"} markSeen />;
}
