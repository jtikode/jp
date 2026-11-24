"use client";

import { useState } from "react";

export function CopyTextButton({ text, label = "Copy message" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="min-h-11 rounded-lg bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-800"
    >
      {state === "copied" ? "Copied" : state === "failed" ? "Could not copy, select the text instead" : label}
    </button>
  );
}
