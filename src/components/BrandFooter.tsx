import Image from "next/image";

export function BrandFooter() {
  const year = new Date().getFullYear();

  return (
    <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 py-2 text-xs text-slate-500">
      <Image src="/brand/jp-logo.jpg" alt="J P Traders" width={16} height={16} className="h-4 w-4 shrink-0 rounded object-contain" />
      <span>© {year} J P Traders</span>
      <span className="text-slate-300">·</span>
      <span>Powered by AI</span>
    </div>
  );
}
