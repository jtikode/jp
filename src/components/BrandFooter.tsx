import Image from "next/image";
import Link from "next/link";

export function BrandFooter() {
  const year = new Date().getFullYear();

  return (
    <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 py-2 text-xs text-slate-500">
      <Image src="/brand/jp-logo.jpg" alt="J P Traders" width={16} height={16} className="h-4 w-4 shrink-0 rounded object-contain" />
      <span>© {year} J P Traders</span>
      <span className="text-slate-300">·</span>
      <span>Powered by AI</span>
      <span className="text-slate-300">·</span>
      <Link href="/blog" className="font-semibold text-blue-700 hover:underline">
        Blog
      </Link>
    </div>
  );
}
