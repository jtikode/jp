import { db } from "@/lib/db";
import { getIstDateParts, getIstNow } from "@/lib/istTime";
import { sendPaymentDigestEmail, type PaymentDigestRow } from "@/lib/paymentDigestEmail";

function istDateLabel(at: Date): string {
  const { year, month, day } = getIstDateParts(at);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

/**
 * Emails every not-yet-sent payment report, one email per IST calendar day.
 * Called every minute by the scheduler but only acts from 23:55 IST on, and
 * picks up leftovers from earlier days too — if the server was down at 23:55
 * yesterday, that day's email goes out today under its own date instead of
 * being silently lost. A day with no payments sends nothing.
 */
export async function runPaymentDigest(): Promise<void> {
  const { hour, minute } = getIstNow();
  if (!(hour === 23 && minute >= 55)) return;
  await sendPendingPaymentDigests();
}

export async function sendPendingPaymentDigests(): Promise<void> {
  const pendingIds = (await db.paymentReport.findMany({ where: { digestSentAt: null }, select: { id: true } })).map(
    (p) => p.id,
  );
  if (pendingIds.length === 0) return;

  // Claim first so a second worker (or the next minute's tick) can't send the
  // same rows again; the exact claim timestamp identifies which rows are ours.
  const claimedAt = new Date();
  const claimed = await db.paymentReport.updateMany({
    where: { id: { in: pendingIds }, digestSentAt: null },
    data: { digestSentAt: claimedAt },
  });
  if (claimed.count === 0) return;

  const rows = await db.paymentReport.findMany({
    where: { digestSentAt: claimedAt },
    include: { store: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const byDate = new Map<string, typeof rows>();
  for (const row of rows) {
    const label = istDateLabel(row.createdAt);
    byDate.set(label, [...(byDate.get(label) ?? []), row]);
  }

  for (const [dateLabel, group] of byDate) {
    const digestRows: PaymentDigestRow[] = group.map((p) => ({
      partyName: p.store.name,
      amount: Number(p.amount),
      invoiceNos: p.invoiceNos,
      utr: p.utr,
      verified: p.verified,
    }));
    try {
      await sendPaymentDigestEmail(dateLabel, digestRows);
    } catch (err) {
      console.error("Payments digest failed for", dateLabel, err);
      // Put them back so the next tick retries instead of dropping them.
      await db.paymentReport.updateMany({
        where: { id: { in: group.map((p) => p.id) }, digestSentAt: claimedAt },
        data: { digestSentAt: null },
      });
    }
  }
}
