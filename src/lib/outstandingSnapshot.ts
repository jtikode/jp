import type { getOrgScopedDb } from "@/lib/orgScopedDb";
import type { MargOutstandingReport } from "@/lib/margOutstanding";

type OrgDb = ReturnType<typeof getOrgScopedDb>;

export interface SnapshotResult {
  ok: boolean;
  error?: string;
  imported: number;
  skippedUnknownCodes: string[];
  // Codes the report listed with no existing store on file — a new Store
  // was created for each (best-effort name/address/phone parsed off the
  // report itself), rather than silently dropping that party's bills.
  createdStores: { code: string; name: string }[];
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
    return { ok: false, error: "No outstanding bills could be read from that file.", imported: 0, skippedUnknownCodes: [], createdStores: [] };
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
      createdStores: [],
    };
  }

  const codes = [...new Set(report.rows.map((r) => r.code))];
  const stores = await db.store.findMany({
    where: { externalCode: { in: codes } },
    select: { id: true, externalCode: true },
  });
  const storeByCode = new Map(stores.map((s) => [s.externalCode as string, s.id]));
  const partyByCode = new Map(report.parties.map((p) => [p.code, p]));

  // A code the report lists that has no matching store yet — rather than
  // drop that party's bills, create the store now from what the report
  // itself printed about it (name/address/phone), same as it would be if
  // an admin had added it by hand. Genuinely unmatchable codes (no party
  // metadata at all — shouldn't happen, but the report's own text is the
  // only source) are the only ones still skipped.
  const unknownCodes = codes.filter((c) => !storeByCode.has(c));
  const createdStores: { code: string; name: string }[] = [];
  const skippedUnknownCodes: string[] = [];
  for (const code of unknownCodes) {
    const party = partyByCode.get(code);
    if (!party) {
      skippedUnknownCodes.push(code);
      continue;
    }
    const name = party.name ?? `Store ${code}`;
    const created = await db.store.create({
      data: {
        orgId: opts.orgId,
        externalCode: code,
        name,
        address: party.address ?? "Address not on file — added from outstanding report",
        phone: party.phone ?? undefined,
      },
      select: { id: true },
    });
    storeByCode.set(code, created.id);
    createdStores.push({ code, name });
  }

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

  return { ok: true, imported: data.length, skippedUnknownCodes, createdStores };
}
