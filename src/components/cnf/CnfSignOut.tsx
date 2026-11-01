"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function CnfSignOut({ base }: { base: string }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/shop/logout", { method: "POST" });
    router.push(`${base}/login`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      aria-label="Sign out"
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600"
    >
      <LogOut size={16} />
    </button>
  );
}
