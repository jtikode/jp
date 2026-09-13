import { requireStoreSession } from "@/lib/retailerPermissions";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { NotificationOptIn } from "@/components/shop/NotificationOptIn";
import { OrderReminderForm } from "@/components/shop/OrderReminderForm";

export default async function OrderReminderPage() {
  const session = await requireStoreSession();
  const db = getOrgScopedDb(session.orgId);
  const lang = await getLang();

  const reminder = await db.orderReminder.findUnique({ where: { storeId: session.storeId } });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_order_reminder_heading")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t(lang, "shop_order_reminder_subtitle")}</p>
      </Card>

      <NotificationOptIn lang={lang} />

      <Card>
        <OrderReminderForm
          lang={lang}
          initial={
            reminder
              ? { dayOfWeek: reminder.dayOfWeek, hour: reminder.hour, minute: reminder.minute, active: reminder.active }
              : null
          }
        />
      </Card>
    </div>
  );
}
