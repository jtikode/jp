import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getBlogPost, type BlogBlock } from "@/lib/blogPosts";
import { buildWhatsAppLink } from "@/lib/waLink";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Post not found | J P Traders" };

  return {
    title: `${post.title} | J P Traders`,
    description: post.description,
  };
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 className="mt-6 mb-2 text-lg font-bold text-slate-900">{block.text}</h2>;
    case "ul":
      return (
        <ul className="my-3 list-disc space-y-1.5 pl-5 text-slate-700">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="my-4 rounded-r-lg border-l-4 border-blue-700 bg-blue-50 py-2 pl-4 text-sm font-medium text-slate-700 italic">
          {block.text}
        </blockquote>
      );
    case "p":
    default:
      return <p className="my-3 leading-relaxed text-slate-700">{block.text}</p>;
  }
}

const REGISTER_MESSAGE =
  "Hi, I read the J P Traders blog and would like to register my medical store for ordering.";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href="/blog"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        All posts
      </Link>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
          {post.category}
        </span>
        <span className="text-xs font-medium text-slate-400">{post.readMinutes} min read</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{post.title}</h1>
      <p className="mt-2 text-base text-slate-500">{post.description}</p>

      <article className="mt-6">
        {post.content.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </article>

      <Card className="mt-8 flex flex-col items-center gap-3 text-center">
        <p className="font-semibold text-slate-900">Already know J P Traders? Order from the full catalog.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/shop/login"
            className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Sign in to order
          </Link>
          <a
            href={buildWhatsAppLink("917721881599", REGISTER_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border-2 border-green-600 bg-green-50 px-5 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100"
          >
            New retailer? Register on WhatsApp
          </a>
        </div>
      </Card>
    </div>
  );
}
