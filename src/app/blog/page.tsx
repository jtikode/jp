import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { blogPosts } from "@/lib/blogPosts";
import { JsonLd } from "@/components/JsonLd";
import { ORG_LOGO_PATH, absoluteUrl, blogJsonLd, breadcrumbJsonLd } from "@/lib/seo";

const TITLE = "Blog";
const DESCRIPTION =
  "Notes on generic medicine margins, branded generics, product range and running a better medical store, from J P Traders, generic medicine distributor.";

const FAQS = [
  {
    question: "How many products does J P Traders stock?",
    answer:
      "J P Traders carries 7,000+ active products across 135+ companies and 2,000+ distinct molecules, spanning 48 product categories.",
  },
  {
    question: "Where is J P Traders located?",
    answer: "J P Traders is based at J P Heights, Mangalwar Peth, Kolhapur, Maharashtra 416012, India.",
  },
  {
    question: "How does a retailer place an order with J P Traders?",
    answer:
      "Retailers order through the J P Traders app at app.jpkop.in (search by product or by salt/composition, add to cart, and place the order), or by messaging J P Traders on WhatsApp.",
  },
  {
    question: "Since when has J P Traders been operating?",
    answer: "J P Traders has been a pharma distributor since 1994.",
  },
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/blog") },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "J P Traders",
    title: `${TITLE} | J P Traders`,
    description: DESCRIPTION,
    url: absoluteUrl("/blog"),
    images: [{ url: ORG_LOGO_PATH }],
  },
  twitter: {
    card: "summary",
    title: `${TITLE} | J P Traders`,
    description: DESCRIPTION,
    images: [ORG_LOGO_PATH],
  },
};

const CATEGORY_STYLES: Record<string, string> = {
  Margins: "bg-amber-100 text-amber-800",
  "Our Range": "bg-blue-100 text-blue-700",
  Operations: "bg-emerald-100 text-emerald-700",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function BlogIndexPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
      <JsonLd data={blogJsonLd()} />
      <JsonLd data={faqJsonLd} />

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

      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">Frequently asked questions</h2>
        <div className="mt-3 flex flex-col gap-3">
          {FAQS.map((faq) => (
            <Card key={faq.question}>
              <h3 className="text-sm font-bold text-slate-900">{faq.question}</h3>
              <p className="mt-1 text-sm text-slate-600">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
