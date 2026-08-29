import Image from "next/image";
import { formatCountdown } from "@/lib/formatCountdown";

export interface BannerCarouselItem {
  id: string;
  imageUrl: string;
  title: string | null;
  linkUrl: string | null;
  expiresAt?: string | null;
}

// Banner links are admin-entered free text — only ever render them as a
// clickable href if they're a genuine http(s) URL, so a stray "javascript:"
// or "data:" value can't execute in a retailer's browser.
function isSafeHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function BannerCarousel({ banners }: { banners: BannerCarouselItem[] }) {
  if (banners.length === 0) return null;

  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
      {banners.map((b) => {
        const countdown = b.expiresAt ? formatCountdown(new Date(b.expiresAt)) : "";
        const img = (
          <div className="relative">
            <Image
              src={b.imageUrl}
              alt={b.title ?? "Banner"}
              width={640}
              height={280}
              className="h-40 w-full shrink-0 snap-center rounded-2xl object-cover sm:h-48"
              unoptimized
            />
            {countdown && (
              <span className="absolute right-2 top-2 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow">
                ⏰ Ends in {countdown}
              </span>
            )}
          </div>
        );
        return (
          <div key={b.id} className="w-[85%] shrink-0 snap-center sm:w-[60%]">
            {b.linkUrl && isSafeHttpUrl(b.linkUrl) ? (
              <a href={b.linkUrl} target="_blank" rel="noopener noreferrer">
                {img}
              </a>
            ) : (
              img
            )}
          </div>
        );
      })}
    </div>
  );
}
