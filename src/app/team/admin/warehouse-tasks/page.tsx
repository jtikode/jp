import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { AddStockItemForm } from "@/components/admin/AddStockItemForm";
import { FileImportForm } from "@/components/admin/FileImportForm";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { deleteStockItem, importStockItems } from "@/actions/stockActions";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";

export default async function AdminStockSheetPage() {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);
  const stockItems = await db.stockItem.findMany({
    where: { active: true },
    orderBy: [{ company: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/team/admin/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        ← Home
      </Link>

      <Card>
        <p className="text-sm text-slate-500">
          Recurring staff tasks (with approval and completion charts) have moved to{" "}
          <Link href="/team/admin/tasks" className="font-semibold text-blue-700 hover:underline">
            Tasks
          </Link>
          . This page is just the physical stock-count sheet.
        </p>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Upload company-wise product list</h2>
        <p className="mb-4 text-sm text-slate-500">
          Excel/CSV with company and item name columns. Re-uploading updates existing items by name
          rather than duplicating them.
        </p>
        <FileImportForm
          action={importStockItems}
          buttonLabel="Upload product list"
          itemLabel="stock items"
        />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Add a single stock sheet item</h2>
        <AddStockItemForm />
      </Card>

      <Card className="overflow-x-auto">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Stock sheet items</h2>
          <ExportExcelButton
            data={stockItems.map((item) => ({
              Company: item.company ?? "",
              Item: item.name,
            }))}
            filename="stock-items"
          />
        </div>
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Company</th>
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {stockItems.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-slate-600">{item.company ?? "—"}</td>
                <td className="py-2 pr-4 font-medium text-slate-900">{item.name}</td>
                <td className="py-2 pr-4">
                  <ConfirmDeleteButton
                    action={deleteStockItem.bind(null, item.id)}
                    confirmMessage={`Remove "${item.name}" from the stock sheet? Past counts for it are deleted too.`}
                  />
                </td>
              </tr>
            ))}
            {stockItems.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-slate-400">
                  No stock items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
