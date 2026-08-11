"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function ShopActivatePage() {
  const router = useRouter();
  const [businessCode, setBusinessCode] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/shop/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessCode, phone, pin }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Activation failed.");
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
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Activate Shop Access</h1>
        <p className="mb-6 text-slate-500">
          Use the phone number your distributor already has on file for your store.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="businessCode" className="mb-1 block text-sm font-medium text-slate-700">
              Business Code
            </label>
            <Input
              id="businessCode"
              autoComplete="organization"
              value={businessCode}
              onChange={(e) => setBusinessCode(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-slate-500">Given to you by your distributor.</p>
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Must match the phone number registered against your store.
            </p>
          </div>

          <div>
            <label htmlFor="pin" className="mb-1 block text-sm font-medium text-slate-700">
              Choose a PIN
            </label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              minLength={4}
            />
            <p className="mt-1 text-xs text-slate-500">At least 4 digits. You&apos;ll use this to sign in.</p>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? "Activating..." : "Activate & Sign In"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already activated?{" "}
          <a href="/shop/login" className="font-medium text-slate-700 underline">
            Sign in
          </a>
        </p>
      </Card>
    </div>
  );
}
