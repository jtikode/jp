import type { Metadata } from "next";

// Overrides the root manifest for everything under /shop — this is the manifest
// the Android TWA (bubblewrap) build points at, scoped to the retailer app only.
export const metadata: Metadata = {
  title: "J P Traders Retailer",
  manifest: "/shop-manifest.webmanifest",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
