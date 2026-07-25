"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "@/lib/clsx";

interface ConfirmDeleteButtonProps {
  confirmMessage: string;
  action: () => Promise<{ ok: boolean; error?: string }>;
  label?: string;
  className?: string;
}

export function ConfirmDeleteButton({
  confirmMessage,
  action,
  label = "Delete",
  className,
}: ConfirmDeleteButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        window.alert(result.error ?? "Could not delete.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={clsx(
        "min-h-11 min-w-11 rounded-lg px-3 text-sm font-semibold text-red-700",
        "hover:bg-red-50 hover:underline disabled:opacity-50",
        className,
      )}
    >
      {pending ? "Deleting..." : label}
    </button>
  );
}
