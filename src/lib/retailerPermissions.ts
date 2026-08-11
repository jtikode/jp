import { redirect } from "next/navigation";
import { getRetailerSession } from "@/lib/retailerSession";

/** For use inside Server Actions: throws instead of redirecting. */
export async function assertStoreSession() {
  const session = await getRetailerSession();

  if (!session.storeId || !session.orgId) {
    throw new Error("Not authorized.");
  }

  return session as Required<typeof session>;
}

export async function requireStoreSession() {
  const session = await getRetailerSession();

  if (!session.storeId || !session.orgId) {
    redirect("/shop/login");
  }

  return session as Required<typeof session>;
}
