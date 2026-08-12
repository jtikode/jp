import Image from "next/image";

export interface BannerCarouselItem {
  id: string;
  imageUrl: string;
  title: string | null;
  linkUrl: string | null;
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
        const img = (
          <Image
            src={b.imageUrl}
            alt={b.title ?? "Banner"}
            width={640}
            height={280}
            className="h-40 w-full shrink-0 snap-center rounded-2xl object-cover sm:h-48"
            unoptimized
          />
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
