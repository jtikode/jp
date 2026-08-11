import Image from "next/image";

export interface BannerCarouselItem {
  id: string;
  imageUrl: string;
  title: string | null;
  linkUrl: string | null;
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
            {b.linkUrl ? (
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
