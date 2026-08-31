import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "J P Traders",
    short_name: "J P Traders",
    description: "Field terminal, telecalling, warehouse and admin operations hub for pharma distributors.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#1d4ed8",
    icons: [
      { src: "/icons/retailer-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/retailer-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
