import Image from "next/image";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { AddBannerForm } from "@/components/admin/AddBannerForm";
import { toggleBannerActive } from "@/actions/bannerActions";

export default async function AdminBannersPage() {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const banners = await db.shopBanner.findMany({
    orderBy: [{ placement: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Add banner</h2>
        <AddBannerForm />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Banners ({banners.length})</h2>
        <div className="flex flex-col gap-3">
          {banners.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-3 rounded-xl border-2 border-slate-200 p-3"
            >
              <Image
                src={b.imageUrl}
                alt={b.title ?? "Banner"}
                width={96}
                height={54}
                className="h-14 w-24 shrink-0 rounded-lg object-cover"
                unoptimized
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">
                  {b.placement === "HERO" ? "Home top carousel" : "Special Offers"}
                  {b.title ? ` — ${b.title}` : ""}
                </p>
                <p className="text-xs text-slate-500">Sort order: {b.sortOrder}</p>
              </div>
              <span
                className={
                  b.active
                    ? "shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                    : "shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500"
                }
              >
                {b.active ? "Active" : "Hidden"}
              </span>
              <form action={toggleBannerActive.bind(null, b.id, !b.active)}>
                <button type="submit" className="text-sm font-semibold text-blue-700 hover:underline">
                  {b.active ? "Hide" : "Show"}
                </button>
              </form>
            </div>
          ))}
          {banners.length === 0 && (
            <p className="py-4 text-center text-slate-400">No banners yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
