"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface InlineRenameButtonProps {
  currentName: string;
  action: (newName: string) => Promise<{ ok: boolean; error?: string }>;
}

// Small "Rename" link used in admin tables (employees, tasks): edits the name
// in place and saves it through the given action.
export function InlineRenameButton({ currentName, action }: InlineRenameButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await action(name);
      if (!result.ok) {
        setError(result.error ?? "Could not rename.");
        return;
      }
      setError(null);
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setName(currentName);
          setError(null);
          setOpen(true);
        }}
        className="text-sm font-semibold text-blue-700 hover:underline"
      >
        Rename
      </button>
    );
  }

  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-center gap-2">
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New name"
          maxLength={80}
          className="h-9 w-44 rounded-lg border-2 border-slate-300 px-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending || name.trim().length === 0 || name.trim() === currentName}
          className="text-sm font-semibold text-green-700 hover:underline disabled:opacity-40"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-semibold text-slate-500 hover:underline"
        >
          Cancel
        </button>
      </span>
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </span>
  );
}
