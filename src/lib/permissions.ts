import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import type { Role } from "@/generated/prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  SALESMAN: "/team/salesman/dashboard",
  TELECALLER: "/team/telecaller/dashboard",
  WAREHOUSE: "/team/warehouse",
  ADMIN: "/team/admin/dashboard",
};

/** For use inside Server Actions: throws instead of redirecting. */
export async function assertRole(allowed: Role[]) {
  const session = await getSession();

  if (!session.userId || !session.orgId || !session.role || !allowed.includes(session.role)) {
    throw new Error("Not authorized.");
  }

  return session as Required<typeof session>;
}

export async function requireRole(allowed: Role[]) {
  const session = await getSession();

  // A session from before multi-tenancy shipped carries no orgId — treat it
  // the same as logged-out rather than letting an unscoped query happen.
  if (!session.userId || !session.orgId || !session.role) {
    redirect("/team/login");
  }

  if (!allowed.includes(session.role)) {
    redirect(ROLE_HOME[session.role]);
  }

  return session as Required<typeof session>;
}
