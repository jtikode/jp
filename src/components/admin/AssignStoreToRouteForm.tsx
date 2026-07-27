"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignMultipleStoresToRoute } from "@/actions/storeActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function AssignStoreToRouteForm({
  routeId,
  stores,
}: {
  routeId: string;
  stores: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const filtered = stores.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    if (selected.size === 0) return;
    startTransition(async () => {
      const result = await assignMultipleStoresToRoute(routeId, [...selected]);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setSelected(new Set());
      setQuery("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Search stores to add..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="max-h-64 overflow-y-auto rounded-xl border-2 border-slate-200">
        {filtered.map((s) => (
          <label
            key={s.id}
            className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selected.has(s.id)}
              onChange={() => toggle(s.id)}
              className="h-4 w-4 shrink-0"
            />
            <span className="text-slate-900">{s.label}</span>
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="p-3 text-center text-sm text-slate-400">No matching stores.</p>
        )}
      </div>
      <Button
        type="button"
        disabled={pending || selected.size === 0}
        onClick={handleSubmit}
        className="min-h-11 px-6 py-2 text-sm"
      >
        {pending
          ? "Adding..."
          : selected.size > 0
            ? `Add ${selected.size} selected to route`
            : "Add selected to route"}
      </Button>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
