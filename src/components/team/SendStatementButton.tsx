"use client";

import { buildStatementMessage, type StatementLine } from "@/lib/statementMessage";
import { toWhatsAppNumber } from "@/lib/waLink";
import { clsx } from "@/lib/clsx";

// The message is built when the button is tapped, not when the page renders,
// so every send gets a freshly picked greeting and sign-off.
export function SendStatementButton({
  phone,
  entries,
  label = "Send Outstanding on WhatsApp",
  className,
}: {
  phone: string | null;
  entries: StatementLine[];
  label?: string;
  className?: string;
}) {
  const number = phone ? toWhatsAppNumber(phone) : null;
  const hasDues = entries.some((e) => e.outstandingAmount !== 0);

  if (!number) return <p className="text-xs text-slate-500">No valid mobile number on file for WhatsApp.</p>;
  if (!hasDues) return null;

  function send() {
    const url = `https://wa.me/${number}?text=${encodeURIComponent(buildStatementMessage(entries))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={send}
      className={clsx(
        "min-h-11 w-full rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-green-700",
        className,
      )}
    >
      {label}
    </button>
  );
}
