export type InviteLang = "mr" | "en";

export const SHOP_APP_URL = "app.jpkop.in";
export const SUPPORT_WHATSAPP = "9860798959";

/**
 * Returns the number as 91XXXXXXXXXX when it is an Indian mobile, otherwise
 * null — landlines (0231-…) and short numbers can't receive WhatsApp.
 */
export function normalizeMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : null;
}

export function buildInviteMessage(
  lang: InviteLang,
  store: { name: string; loginCode: string; password: string },
): string {
  if (lang === "mr") {
    return [
      `नमस्कार ${store.name},`,
      "",
      "जे.पी. ट्रेडर्सचे ऑनलाईन ऑर्डर App सुरू झाले आहे. आता फोन किंवा प्रतिनिधीशिवाय, काही सेकंदात ऑर्डर करा.",
      "",
      `वेबसाईट: ${SHOP_APP_URL}`,
      `Login ID: ${store.loginCode}`,
      `Password: ${store.password}`,
      "",
      "App मध्ये: नवीन ऑफर्स, जास्त विकले जाणारे प्रोडक्ट्स, आपली थकबाकी आणि जुनी ऑर्डर एका जागी.",
      "",
      `मदतीसाठी WhatsApp करा: ${SUPPORT_WHATSAPP}`,
    ].join("\n");
  }
  return [
    `Hello ${store.name},`,
    "",
    "J P Traders now has an online ordering app. Place your order in seconds, no phone call needed.",
    "",
    `Website: ${SHOP_APP_URL}`,
    `Login ID: ${store.loginCode}`,
    `Password: ${store.password}`,
    "",
    "Inside: latest offers, hot-selling products, your outstanding and past orders in one place.",
    "",
    `Need help? WhatsApp us: ${SUPPORT_WHATSAPP}`,
  ].join("\n");
}
