"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CnfLogin({ base }: { base: string }) {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/cnf/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, pin: secret }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign in failed.");
        return;
      }
      router.push(`${base}/`);
      router.refresh();
    } catch {
      setError("Network problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Distributor Orders</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">J P Traders. DKT, Morepen Devices, Morepen Burnol and Ambitech.</p>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="cnf-id" className="mb-1 block text-sm font-medium text-slate-700">
              Login Id
            </label>
            <input
              id="cnf-id"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              autoComplete="username"
              required
              className="h-12 w-full rounded-xl border-2 border-slate-300 px-3 text-base focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="cnf-secret" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="cnf-secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="current-password"
              required
              className="h-12 w-full rounded-xl border-2 border-slate-300 px-3 text-base focus:border-blue-600 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 rounded-xl bg-blue-700 text-base font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">Use the same Login Id and password as the J P Traders app.</p>
      </div>
    </div>
  );
}
