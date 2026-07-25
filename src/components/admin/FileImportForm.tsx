"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";

type ImportAction = (
  prevState: { ok: boolean; error?: string; rowCount?: number } | null,
  formData: FormData,
) => Promise<{ ok: boolean; error?: string; rowCount?: number }>;

const initialState = { ok: false, error: undefined, rowCount: undefined };

interface FileImportFormProps {
  action: ImportAction;
  buttonLabel: string;
  itemLabel: string;
  accept?: string;
}

export function FileImportForm({
  action,
  buttonLabel,
  itemLabel,
  accept = ".csv,.xlsx,.xls",
}: FileImportFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="file"
        name="file"
        accept={accept}
        required
        className="min-h-14 flex-1 rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Uploading..." : buttonLabel}
      </Button>

      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state.ok && (
        <p className="text-sm font-medium text-green-700">
          Imported {state.rowCount} {itemLabel}.
        </p>
      )}
    </form>
  );
}
