import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { FileImportForm } from "@/components/admin/FileImportForm";
import { importStoreMaster, importLedger, importPurchaseHistory } from "@/actions/importActions";

export default async function ImportsPage() {
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
        <h2 className="mb-1 text-lg font-bold text-slate-900">Upload ledger / outstanding data</h2>
        <p className="mb-4 text-sm text-slate-500">
          CSV or Excel export from billing software, matched to stores by store code.
        </p>
        <FileImportForm action={importLedger} buttonLabel="Upload ledger" itemLabel="ledger entries" />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Upload purchase history</h2>
        <p className="mb-4 text-sm text-slate-500">
          Past order/item history per store, used for upsell suggestions.
        </p>
        <FileImportForm
          action={importPurchaseHistory}
          buttonLabel="Upload purchase history"
          itemLabel="purchase history rows"
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
