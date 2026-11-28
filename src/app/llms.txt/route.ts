import { blogPosts } from "@/lib/blogPosts";
import { ORG_ADDRESS, ORG_FOUNDING_YEAR, ORG_PHONES, SITE_URL, absoluteUrl } from "@/lib/seo";

// Generated from blogPosts.ts so a new post is picked up automatically —
// nothing here needs updating by hand when the blog changes.
export function GET() {
  const body = `# J P Traders

> J P Traders is a pharma and FMCG wholesale distributor based in ${ORG_ADDRESS.addressLocality}, ${ORG_ADDRESS.addressRegion}, India, operating since ${ORG_FOUNDING_YEAR}. It supplies 7,000+ products across 135+ companies and 2,000+ molecules to 3,400+ retail medical stores through a direct ordering app.

## Key facts

- Founded: ${ORG_FOUNDING_YEAR}
- Location: ${ORG_ADDRESS.streetAddress}, ${ORG_ADDRESS.addressLocality}, ${ORG_ADDRESS.addressRegion} ${ORG_ADDRESS.postalCode}, India
- Catalog: 7,000+ active products, 135+ companies, 2,000+ distinct molecules, 48 product categories
- Retailers served: 3,400+
- Ordering channels: the J P Traders app (${SITE_URL.replace("https://", "")}), WhatsApp, or a visiting salesman
- Contact (WhatsApp/phone): ${ORG_PHONES.join(", ")}

## Guides

- [How to order from the app](${absoluteUrl("/how-to-order")}): a 5-step walkthrough for a retailer to install the app and place a first order.

## Blog

${blogPosts.map((post) => `- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)})`).join("\n")}

## Notes

Most of ${SITE_URL.replace("https://", "")} sits behind a retailer or staff login and is intentionally excluded from indexing (see /robots.txt) — the blog, the how-to-order guide and this file are the only pages meant for public and AI-crawler access.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
