import type { MetadataRoute } from "next";

const BASE_URL = "https://app.jpkop.in";

// Only the blog is meant to be publicly indexed — the rest of the app sits
// behind a retailer/admin login anyway, so there's nothing there for a
// crawler to usefully index, and the product catalog pages are deliberately
// marked noindex (see /shop/p/[id]) so competitors can't scrape rates.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/blog", disallow: "/" },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
