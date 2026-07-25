"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignStoreToRoute } from "@/actions/storeActions";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export function AssignStoreToRouteForm({
  routeId,
  stores,
}: {
  routeId: string;
  stores: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [storeId, setStoreId] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId) return;
    startTransition(async () => {
      const result = await assignStoreToRoute(routeId, storeId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setStoreId("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select
        value={storeId}
        onChange={(e) => setStoreId(e.target.value)}
        className="flex-1"
        required
      >
        <option value="" disabled>
          Choose a store to add
        </option>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={pending || !storeId} className="min-h-11 px-6 py-2 text-sm">
        {pending ? "Adding..." : "Add to route"}
      </Button>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </form>
  );
}
