import Image from "next/image";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { AddBannerForm } from "@/components/admin/AddBannerForm";
import { SendNotificationForm } from "@/components/admin/SendNotificationForm";
import { ScheduledNotificationsList } from "@/components/admin/ScheduledNotificationsList";
import { EditBannerCartItems } from "@/components/admin/BannerBundleEditor";
import { parseBundleItems } from "@/lib/bannerBundle";
import { toggleBannerActive } from "@/actions/bannerActions";

export default async function AdminBannersPage() {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const [banners, scheduledNotifications] = await Promise.all([
    db.shopBanner.findMany({
      orderBy: [{ placement: "asc" }, { sortOrder: "asc" }],
    }),
    db.scheduledNotification.findMany({
      orderBy: { scheduledAt: "desc" },
      take: 20,
    }),
  ]);

  const bundleByBanner = new Map(banners.map((b) => [b.id, parseBundleItems(b.cartItems)]));
  const bundleProductIds = [...new Set([...bundleByBanner.values()].flatMap((items) => items.map((i) => i.productId)))];
  const bundleProducts = bundleProductIds.length
    ? await db.product.findMany({ where: { id: { in: bundleProductIds } }, select: { id: true, name: true } })
    : [];
  const productName = new Map(bundleProducts.map((p) => [p.id, p.name]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Send Notification</h2>
        <p className="mb-4 text-sm text-slate-500">
          Sends an instant push notification to every retailer who has notifications enabled on the
          shop app, for one-off announcements, unlike the automatic order-status pushes.
        </p>
        <SendNotificationForm />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          Scheduled Notifications ({scheduledNotifications.length})
        </h2>
        <ScheduledNotificationsList
          notifications={scheduledNotifications.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            scheduledAt: n.scheduledAt.toISOString(),
            status: n.status,
            sentCount: n.sentCount,
            storeCount: n.storeCount,
          }))}
        />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Add banner</h2>
        <AddBannerForm />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Banners ({banners.length})</h2>
        <div className="flex flex-col gap-3">
          {banners.map((b) => {
            const bundle = bundleByBanner.get(b.id) ?? [];
            const editorItems = bundle.map((i) => ({
              ...i,
              name: productName.get(i.productId) ?? "(unavailable product)",
            }));
            return (
              <div key={b.id} className="rounded-xl border-2 border-slate-200 p-3">
                <div className="flex items-center gap-3">
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
                      {b.title ? `: ${b.title}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">Sort order: {b.sortOrder}</p>
                    {editorItems.length > 0 && (
                      <p className="mt-0.5 text-xs font-medium text-blue-700">
                        Adds to cart:{" "}
                        {editorItems
                          .map((i) => `${i.name} × ${i.quantity}${i.freeQty > 0 ? ` (${i.freeQty} free)` : ""}`)
                          .join(", ")}
                      </p>
                    )}
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
                <details className="mt-3 border-t border-slate-100 pt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                    {editorItems.length > 0 ? "Edit cart items" : "Set cart items (tap to add to cart)"}
                  </summary>
                  <div className="mt-3">
                    <EditBannerCartItems bannerId={b.id} initialItems={editorItems} />
                  </div>
                </details>
              </div>
            );
          })}
          {banners.length === 0 && (
            <p className="py-4 text-center text-slate-400">No banners yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
