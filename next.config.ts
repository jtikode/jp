import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Statically pre-built pages (e.g. /shop/login) are served with a long
        // s-maxage and no Vary on the RSC request headers, so a browser or CDN
        // can cache the raw RSC payload under the page's URL and later show it
        // as plain text. Vary keeps the HTML and RSC variants apart.
        source: "/:path*",
        headers: [{ key: "Vary", value: "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch" }],
      },
    ];
  },
};

export default nextConfig;
