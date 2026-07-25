import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { RouteForm } from "@/components/admin/RouteForm";
import { AssignRouteForm } from "@/components/admin/AssignRouteForm";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { unassignRoute, deleteRoute } from "@/actions/routeActions";

export default async function RoutesPage() {
  const [routes, salesmen] = await Promise.all([
    db.route.findMany({
      orderBy: { name: "asc" },
      include: { assignments: { include: { user: true } }, stores: true },
    }),
    db.user.findMany({ where: { role: "SALESMAN", active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Add route</h2>
        <RouteForm />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Assign salesman to route</h2>
        <AssignRouteForm
          salesmen={salesmen.map((s) => ({ id: s.id, label: s.name }))}
          routes={routes.map((r) => ({ id: r.id, label: r.name }))}
        />
      </Card>

      <div className="space-y-4">
        {routes.map((route) => (
          <Card key={route.id}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900">{route.name}</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{route.stores.length} stores</span>
                <ConfirmDeleteButton
                  action={deleteRoute.bind(null, route.id)}
                  confirmMessage={`Delete route "${route.name}"? Stores and past visits stay, just detached from this route. This can't be undone.`}
                />
              </div>
            </div>
            {route.description && <p className="mb-2 text-sm text-slate-500">{route.description}</p>}
            <div className="flex flex-wrap gap-2">
              {route.assignments.map((a) => (
                <form key={a.id} action={unassignRoute.bind(null, a.id)}>
                  <button
                    type="submit"
                    className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 hover:bg-blue-100"
                    title="Click to unassign"
                  >
                    {a.user.name} ✕
                  </button>
                </form>
              ))}
              {route.assignments.length === 0 && (
                <p className="text-sm text-slate-400">No salesmen assigned yet.</p>
              )}
            </div>
          </Card>
        ))}
        {routes.length === 0 && (
          <Card>
            <p className="text-center text-slate-400">No routes yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
