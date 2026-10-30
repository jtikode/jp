// The retailer app's Google Play listing. The referrer tags installs that came
// from the website so Play Console / Google Analytics can tell them apart.
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.jp.jp_supply_chain_pharmacies&referrer=utm_source%3Dapp_jpkop_in%26utm_medium%3Dweb";

const IN_APP_KEY = "jpt_in_play_app";

/**
 * True when the visitor is in a normal browser and could install the Play app:
 * false inside the installed app itself (the TWA runs standalone and opens
 * with an android-app:// referrer) and on iPhone/iPad, where Play isn't an
 * option. Client-only — returns false on the server.
 */
export function shouldOfferPlayStore(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (document.referrer.startsWith("android-app://")) sessionStorage.setItem(IN_APP_KEY, "1");
    if (sessionStorage.getItem(IN_APP_KEY) === "1") return false;
  } catch {
    // Storage blocked — fall through to the other checks.
  }
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (standalone) return false;
  return !/iPhone|iPad|iPod/i.test(navigator.userAgent);
}
