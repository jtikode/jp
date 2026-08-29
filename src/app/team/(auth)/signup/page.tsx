"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SignupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [businessCode, setBusinessCode] = useState("");
  const [codeEdited, setCodeEdited] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleBusinessNameChange(value: string) {
    setBusinessName(value);
    if (!codeEdited) {
      setBusinessCode(slugify(value));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          businessCode,
          adminName,
          adminUsername,
          adminPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Signup failed.");
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
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mb-6 text-slate-500">Set up your business on MedPoint</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="businessName" className="mb-1 block text-sm font-medium text-slate-700">
              Business Name
            </label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => handleBusinessNameChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="businessCode" className="mb-1 block text-sm font-medium text-slate-700">
              Business Code
            </label>
            <Input
              id="businessCode"
              value={businessCode}
              onChange={(e) => {
                setCodeEdited(true);
                setBusinessCode(slugify(e.target.value));
              }}
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Your team will use this code to sign in. Lowercase letters, numbers, hyphens only.
            </p>
          </div>

          <div>
            <label htmlFor="adminName" className="mb-1 block text-sm font-medium text-slate-700">
              Your Name
            </label>
            <Input
              id="adminName"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="adminUsername" className="mb-1 block text-sm font-medium text-slate-700">
              Admin Username
            </label>
            <Input
              id="adminUsername"
              autoComplete="username"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="adminPassword" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <Input
              id="adminPassword"
              type="password"
              autoComplete="new-password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <a href="/team/login" className="font-medium text-slate-700 underline">
            Sign in
          </a>
        </p>
      </Card>
    </div>
  );
}
