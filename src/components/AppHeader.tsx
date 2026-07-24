"use client";

import { useRouter } from "next/navigation";

interface AppHeaderProps {
  title: string;
  name: string;
}

export function AppHeader({ title, name }: AppHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div>
        <p className="text-lg font-bold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{name}</p>
      </div>
      <button
        onClick={handleLogout}
        className="min-h-11 rounded-lg border-2 border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Log out
      </button>
    </header>
  );
}
