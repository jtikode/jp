export function BrandFooter() {
  const year = new Date().getFullYear();

  return (
    <div className="flex items-center justify-center gap-1 bg-slate-900 py-2 text-xs text-slate-400">
      <span>© {year} J.P. Traders — Operations Hub</span>
      <span className="text-slate-600">·</span>
      <span>Powered by JP AI</span>
    </div>
  );
}
