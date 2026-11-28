import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blogPosts";

const BASE_URL = "https://app.jpkop.in";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/how-to-order`, changeFrequency: "monthly", priority: 0.5 },
    ...blogPosts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
