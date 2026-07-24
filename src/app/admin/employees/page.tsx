import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { toggleEmployeeActive } from "@/actions/employeeActions";

export default async function EmployeesPage() {
  const employees = await db.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Add employee</h2>
        <EmployeeForm />
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-4 text-lg font-bold text-slate-900">All employees</h2>
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Username</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{emp.name}</td>
                <td className="py-2 pr-4 text-slate-600">{emp.username}</td>
                <td className="py-2 pr-4 text-slate-600">{emp.role}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      emp.active
                        ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                        : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500"
                    }
                  >
                    {emp.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-3">
                    {emp.role === "SALESMAN" && (
                      <Link
                        href={`/admin/employees/${emp.id}/targets`}
                        className="text-sm font-semibold text-blue-700 hover:underline"
                      >
                        Targets
                      </Link>
                    )}
                    <form action={toggleEmployeeActive.bind(null, emp.id, !emp.active)}>
                      <button
                        type="submit"
                        className="text-sm font-semibold text-blue-700 hover:underline"
                      >
                        {emp.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-400">
                  No employees yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
