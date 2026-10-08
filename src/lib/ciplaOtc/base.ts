import { headers } from "next/headers";

// On cipla.jpkop.in the middleware serves /cipla/* at the root, so links drop
// the prefix; on app.jpkop.in (or localhost) the portal lives under /cipla.
export async function getCiplaBase(): Promise<"" | "/cipla"> {
  const host = (await headers()).get("host") ?? "";
  return host.startsWith("cipla.") ? "" : "/cipla";
}
