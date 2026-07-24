import { Card } from "@/components/ui/Card";
import { WarehouseActionForm } from "@/components/forms/WarehouseActionForm";
import { WarehouseActionList } from "@/components/forms/WarehouseActionList";

export default function WarehouseFulfillmentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <h1 className="mb-4 text-lg font-bold text-slate-900">Log Order Fulfillment</h1>
        <WarehouseActionForm taskType="FULFILLMENT" />
      </Card>
      <WarehouseActionList taskType="FULFILLMENT" />
    </div>
  );
}
