import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "J.P. Traders Operations Hub",
    short_name: "JPT Hub",
    description: "Field terminal, telecalling, warehouse and admin operations hub for J.P. Traders.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#1d4ed8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
