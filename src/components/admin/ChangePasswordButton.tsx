"use client";

import { useState, useTransition } from "react";

interface ChangePasswordButtonProps {
  employeeName: string;
  action: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
}

// "Change password" link in the employees table: opens a small inline box to
// type the new password (shown as plain text so the admin can read it out to
// the employee), then saves it.
export function ChangePasswordButton({ employeeName, action }: ChangePasswordButtonProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!window.confirm(`Set a new password for ${employeeName}?`)) return;
    startTransition(async () => {
      const result = await action(password);
      if (!result.ok) {
        setMessage({ ok: false, text: result.error ?? "Could not change the password." });
        return;
      }
      setMessage({ ok: true, text: `Password changed. New password: ${password}` });
      setPassword("");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <span className="flex flex-col">
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setOpen(true);
          }}
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          Change password
        </button>
        {message && (
          <span className={message.ok ? "text-xs font-medium text-green-700" : "text-xs font-medium text-red-600"}>
            {message.text}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-center gap-2">
        <input
          type="text"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 6)"
          autoComplete="off"
          className="h-9 w-44 rounded-lg border-2 border-slate-300 px-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending || password.length < 6}
          className="text-sm font-semibold text-green-700 hover:underline disabled:opacity-40"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setPassword("");
            setMessage(null);
          }}
          className="text-sm font-semibold text-slate-500 hover:underline"
        >
          Cancel
        </button>
      </span>
      {message && !message.ok && <span className="text-xs font-medium text-red-600">{message.text}</span>}
    </span>
  );
}
