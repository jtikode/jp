import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { blogPosts } from "@/lib/blogPosts";

export const metadata: Metadata = {
  title: "Blog | J P Traders",
  description:
    "Notes on generic medicine margins, branded generics, product range and running a better medical store, from J P Traders, generic medicine distributor.",
};

const CATEGORY_STYLES: Record<string, string> = {
  Margins: "bg-amber-100 text-amber-800",
  "Our Range": "bg-blue-100 text-blue-700",
  Operations: "bg-emerald-100 text-emerald-700",
};

export default function BlogIndexPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">J P Traders Blog</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
          Straight talk on margins, branded generics, product range and running a better medical
          store, from your generic medicine distributor.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {blogPosts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <Card className="transition-colors hover:border-blue-300 hover:bg-blue-50/40">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${CATEGORY_STYLES[post.category] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {post.category}
                </span>
                <span className="text-xs font-medium text-slate-400">{post.readMinutes} min read</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{post.title}</h2>
              <p className="mt-1.5 text-sm text-slate-600">{post.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
