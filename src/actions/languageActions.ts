"use server";

import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";
import { LANG_COOKIE } from "@/lib/langCookie";

export async function setLanguage(lang: Lang): Promise<void> {
  const store = await cookies();
  store.set(LANG_COOKIE, lang, { maxAge: 60 * 60 * 24 * 365, path: "/" });
}
