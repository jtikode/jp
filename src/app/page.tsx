import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/permissions";

export default async function RootPage() {
  const session = await getSession();

  if (session.userId && session.role) {
    redirect(ROLE_HOME[session.role]);
  }

  redirect("/login");
}
