import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRetailerSession } from "@/lib/retailerSession";
import { ROLE_HOME } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const session = await getSession();

  if (session.userId && session.role) {
    redirect(ROLE_HOME[session.role]);
  }

  const retailerSession = await getRetailerSession();
  if (retailerSession.storeId && retailerSession.orgId) {
    redirect("/shop/home");
  }

  // Retailers are the primary audience — send unauthenticated visitors to
  // the shop login first. Staff can still reach /team/login directly.
  redirect("/shop/login");
}
