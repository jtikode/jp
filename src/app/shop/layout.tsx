import type { Metadata } from "next";
import { getLang } from "@/lib/langCookie";
import { PlayStoreBanner } from "@/components/shop/PlayStoreBanner";

// Overrides the root manifest for everything under /shop — this is the manifest
// the Android TWA (bubblewrap) build points at, scoped to the retailer app only.
export const metadata: Metadata = {
  title: "J P Traders Retailer",
  manifest: "/shop-manifest.webmanifest",
};

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <>
      <PlayStoreBanner lang={lang} />
      {children}
    </>
  );
}
