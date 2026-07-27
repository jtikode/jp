import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

const LANG_COOKIE = "lang";

/** Defaults to Marathi until the user explicitly switches, then remembers their choice. */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === "en" ? "en" : "mr";
}

export { LANG_COOKIE };
