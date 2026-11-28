import type { BlogPost } from "@/lib/blogPosts";
import { blogPosts } from "@/lib/blogPosts";

// Single source of truth for the facts that back the site's metadata and
// structured data (Organization/LocalBusiness, breadcrumbs, blog schema).
// Keeping them here instead of duplicated across page files means the
// sitemap, robots, JSON-LD and <meta> tags can never quietly drift apart.
export const SITE_URL = "https://app.jpkop.in";
export const ORG_NAME = "J P Traders";
export const ORG_DESCRIPTION =
  "J P Traders is a pharma and FMCG wholesale distributor in Kolhapur, Maharashtra, supplying 7,000+ products across 135+ companies to 3,400+ retail medical stores.";
export const ORG_FOUNDING_YEAR = "1994";
export const ORG_LOGO_PATH = "/brand/jp-logo.jpg";
export const ORG_PHONES = ["+917721881599", "+919422046470"];
export const ORG_ADDRESS = {
  streetAddress: "J P Heights, Mangalwar Peth",
  addressLocality: "Kolhapur",
  addressRegion: "Maharashtra",
  postalCode: "416012",
  addressCountry: "IN",
};

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${SITE_URL}/#organization`,
    name: ORG_NAME,
    url: SITE_URL,
    logo: absoluteUrl(ORG_LOGO_PATH),
    image: absoluteUrl(ORG_LOGO_PATH),
    description: ORG_DESCRIPTION,
    foundingDate: ORG_FOUNDING_YEAR,
    address: {
      "@type": "PostalAddress",
      ...ORG_ADDRESS,
    },
    telephone: ORG_PHONES[0],
    contactPoint: ORG_PHONES.map((phone) => ({
      "@type": "ContactPoint",
      telephone: phone,
      contactType: "customer service",
      areaServed: "IN",
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function blogJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/blog#blog`,
    name: "J P Traders Blog",
    description:
      "Notes on generic medicine margins, branded generics, product range and running a better medical store, from J P Traders, generic medicine distributor.",
    url: absoluteUrl("/blog"),
    publisher: { "@id": `${SITE_URL}/#organization` },
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`),
    })),
  };
}

export function blogPostingJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": absoluteUrl(`/blog/${post.slug}#post`),
    headline: post.title,
    description: post.description,
    url: absoluteUrl(`/blog/${post.slug}`),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    articleSection: post.category,
    publisher: { "@id": `${SITE_URL}/#organization` },
    author: { "@id": `${SITE_URL}/#organization` },
  };
}
