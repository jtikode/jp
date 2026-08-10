import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { FileImportForm } from "@/components/admin/FileImportForm";
import {
  importStoreMaster,
  importOutstanding,
  importPurchaseHistory,
  importExpiryItems,
  importTelecallerParties,
  importIncentiveItems,
} from "@/actions/importActions";

export default async function ImportsPage() {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);
  const batches = await db.importBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: true },
    take: 20,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Upload store master list</h2>
        <p className="mb-4 text-sm text-slate-500">
          CSV or Excel file with store code, name, address, phone, and route columns.
        </p>
        <FileImportForm action={importStoreMaster} buttonLabel="Upload store list" itemLabel="stores" />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Upload outstanding data</h2>
        <p className="mb-4 text-sm text-slate-500">
          PDF (or CSV/Excel) export from billing software, matched to stores by store code. Can
          cover mixed routes — only the stores in the file get their outstanding figures replaced.
        </p>
        <FileImportForm
          action={importOutstanding}
          buttonLabel="Upload outstanding"
          itemLabel="outstanding entries"
          accept=".pdf,.csv,.xlsx,.xls"
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Upload regular items</h2>
        <p className="mb-4 text-sm text-slate-500">
          Excel export of yearly purchases per store (Party VS Item Wise Sale Analysis), used to
          show telecallers what each medical regularly buys. Only stores in the file get their
          item list replaced.
        </p>
        <FileImportForm
          action={importPurchaseHistory}
          buttonLabel="Upload purchase history"
          itemLabel="purchase history rows"
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Upload near-expiry stock</h2>
        <p className="mb-4 text-sm text-slate-500">
          Item name, expiry date, and special rate. Each upload replaces the whole list — upload
          this whenever your near-expiry stock changes.
        </p>
        <FileImportForm
          action={importExpiryItems}
          buttonLabel="Upload expiry list"
          itemLabel="expiry items"
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Upload telecaller party list</h2>
        <p className="mb-4 text-sm text-slate-500">
          CSV or Excel with a store code column. Sets exactly which parties telecallers see and
          call — each upload replaces the whole list. Until the first upload, telecallers see every
          store.
        </p>
        <FileImportForm
          action={importTelecallerParties}
          buttonLabel="Upload party list"
          itemLabel="parties"
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Upload incentive product list</h2>
        <p className="mb-4 text-sm text-slate-500">
          Item name and incentive amount columns. Shown to salesmen as &quot;Current Incentives&quot;
          on their dashboard — each upload replaces the whole list.
        </p>
        <FileImportForm
          action={importIncentiveItems}
          buttonLabel="Upload incentive list"
          itemLabel="incentive items"
        />
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Recent uploads</h2>
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">File</th>
              <th className="py-2 pr-4">Rows</th>
              <th className="py-2 pr-4">By</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-slate-600">{b.createdAt.toLocaleString()}</td>
                <td className="py-2 pr-4 text-slate-600">{b.importType}</td>
                <td className="py-2 pr-4 text-slate-600">{b.fileName}</td>
                <td className="py-2 pr-4 text-slate-600">{b.rowCount}</td>
                <td className="py-2 pr-4 text-slate-600">{b.uploadedBy.name}</td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-400">
                  No uploads yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
