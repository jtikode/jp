import { headers } from "next/headers";

// On cnf.jpkop.in the middleware serves /cnf/* at the root, so links drop the
// prefix; on app.jpkop.in (or localhost) the portal lives under /cnf.
export async function getCnfBase(): Promise<"" | "/cnf"> {
  const host = (await headers()).get("host") ?? "";
  return host.startsWith("cnf.") ? "" : "/cnf";
}
