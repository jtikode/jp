"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

// Temporary: this deployment only serves J P Traders, so the multi-tenant
// Business Code field is hidden from the form and hardcoded here instead.
// Revert to a visible field (see git history) once this app serves more
// than one distributor.
const BUSINESS_CODE = "jptraders";

export default function ShopLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/shop/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessCode: BUSINESS_CODE, loginId, pin }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }

      router.push(data.redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Shop Generic Medicines</h1>
        <p className="mb-2 text-slate-500">Sign in to order from your distributor</p>
        <p className="mb-6 text-xs font-medium text-blue-700">
          India&apos;s first AI-based ordering platform, personalized to your store&apos;s buying history.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="loginId" className="mb-1 block text-sm font-medium text-slate-700">
              Login Id
            </label>
            <Input
              id="loginId"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit code"
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="pin" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          First time ordering online?{" "}
          <a href="/shop/register" className="font-medium text-slate-700 underline">
            Register Account
          </a>
        </p>
      </Card>
    </div>
  );
}
