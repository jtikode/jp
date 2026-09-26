import type { getOrgScopedDb } from "@/lib/orgScopedDb";
import type { MargOutstandingReport } from "@/lib/margOutstanding";

type OrgDb = ReturnType<typeof getOrgScopedDb>;

export interface SnapshotResult {
  ok: boolean;
  error?: string;
  imported: number;
  skippedUnknownCodes: string[];
}

/**
 * Replaces the whole outstanding ledger with a MARG "Debtors Outstanding"
 * report. That report lists every party with dues, so a party missing from it
 * has nothing outstanding any more — its old entries are cleared too.
 *
 * Refuses to touch live data unless the parsed bills and balance match the
 * count and grand total the report prints about itself.
 */
export async function applyMargOutstandingSnapshot(
  db: OrgDb,
  opts: { orgId: string; uploadedById: string; fileName: string; report: MargOutstandingReport },
): Promise<SnapshotResult> {
  const { report } = opts;
  const total = report.rows.reduce((sum, r) => sum + r.outstandingAmount, 0);

  if (report.rows.length === 0) {
    return { ok: false, error: "No outstanding bills could be read from that file.", imported: 0, skippedUnknownCodes: [] };
  }
  if (
    (report.expectedBills !== null && report.expectedBills !== report.rows.length) ||
    (report.expectedTotal !== null && Math.abs(report.expectedTotal - total) > 1)
  ) {
    return {
      ok: false,
      error: `File looks incomplete: read ${report.rows.length} bills / ${Math.round(total)} but the report says ${report.expectedBills} bills / ${report.expectedTotal}. Nothing was changed.`,
      imported: 0,
      skippedUnknownCodes: [],
    };
  }

  const codes = [...new Set(report.rows.map((r) => r.code))];
  const stores = await db.store.findMany({
    where: { externalCode: { in: codes } },
    select: { id: true, externalCode: true },
  });
  const storeByCode = new Map(stores.map((s) => [s.externalCode as string, s.id]));
  const skippedUnknownCodes = codes.filter((c) => !storeByCode.has(c));

  const batch = await db.importBatch.create({
    data: {
      orgId: opts.orgId,
      importType: "OUTSTANDING",
      fileName: opts.fileName,
      rowCount: 0,
      uploadedById: opts.uploadedById,
    },
  });

  const data = report.rows
    .filter((r) => storeByCode.has(r.code))
    .map((r) => ({
      orgId: opts.orgId,
      storeId: storeByCode.get(r.code) as string,
      invoiceNo: r.invoiceNo ?? undefined,
      invoiceDate: r.invoiceDate ?? undefined,
      dueDate: r.dueDate ?? undefined,
      amount: r.billAmount,
      outstandingAmount: r.outstandingAmount,
      uploadBatchId: batch.id,
    }));

  await db.ledgerEntry.deleteMany({});
  for (let i = 0; i < data.length; i += 500) {
    await db.ledgerEntry.createMany({ data: data.slice(i, i + 500) });
  }
  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: data.length } });

  return { ok: true, imported: data.length, skippedUnknownCodes };
}
