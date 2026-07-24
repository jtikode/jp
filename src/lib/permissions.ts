import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import type { Role } from "@/generated/prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  SALESMAN: "/salesman/dashboard",
  TELECALLER: "/telecaller/dashboard",
  WAREHOUSE: "/warehouse/inward",
  ADMIN: "/admin/dashboard",
};

/** For use inside Server Actions: throws instead of redirecting. */
export async function assertRole(allowed: Role[]) {
  const session = await getSession();

  if (!session.userId || !session.role || !allowed.includes(session.role)) {
    throw new Error("Not authorized.");
  }

  return session as Required<typeof session>;
}

export async function requireRole(allowed: Role[]) {
  const session = await getSession();

  if (!session.userId || !session.role) {
    redirect("/login");
  }

  if (!allowed.includes(session.role)) {
    redirect(ROLE_HOME[session.role]);
  }

  return session as Required<typeof session>;
}
