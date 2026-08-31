import Image from "next/image";

export function BrandBar() {
  return (
    <div className="bg-white shadow-sm">
      <div className="flex items-center justify-center gap-2.5 py-2">
        <Image src="/brand/jp-logo.jpg" alt="J P Traders" width={36} height={36} className="h-9 w-9 rounded-md object-contain" />
        <span className="text-base font-bold tracking-wide text-slate-900 sm:text-lg">J P TRADERS</span>
      </div>
      <div style={{ height: 4, background: "linear-gradient(to right, #dc2626, #1d4ed8)" }} />
    </div>
  );
}
