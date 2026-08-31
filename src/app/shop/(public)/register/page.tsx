"use client";

import { useActionState } from "react";
import { submitShopRegistration, type RegistrationState } from "@/actions/shopRegistrationActions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { buildWhatsAppLink } from "@/lib/waLink";

const initialState: RegistrationState = { ok: false };
const KNOW_YOUR_LOGIN_MESSAGE =
  "Hi, I registered my shop on J P Traders and would like to know my Login ID and Password.";

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function ShopRegisterPage() {
  const [state, formAction, pending] = useActionState(submitShopRegistration, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Register Account</h1>
        <p className="mb-6 text-slate-500">
          Tell us about your shop — we&apos;ll review your details and set up your login.
        </p>

        {state.ok ? (
          <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            Thanks! We&apos;ve received your details and will be in touch to set up your login.
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <Field id="medicalName" label="Name of Medical">
              <Input id="medicalName" name="medicalName" required />
            </Field>

            <Field id="ownerName" label="Name of Owner">
              <Input id="ownerName" name="ownerName" required />
            </Field>

            <Field id="whatsappNumber" label="WhatsApp Number">
              <Input id="whatsappNumber" name="whatsappNumber" type="tel" autoComplete="tel" required />
            </Field>

            <Field id="email" label="Email Address" hint="If applicable">
              <Input id="email" name="email" type="email" autoComplete="email" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field id="drugLicense20B" label="Drug License (20-B)">
                <Input id="drugLicense20B" name="drugLicense20B" required />
              </Field>
              <Field id="drugLicense21B" label="Drug License (21-B)">
                <Input id="drugLicense21B" name="drugLicense21B" required />
              </Field>
            </div>

            <Field id="licenseExpiry" label="License Expiry">
              <Input id="licenseExpiry" name="licenseExpiry" type="date" required />
            </Field>

            <Field id="gstNumber" label="GST Number" hint="If applicable">
              <Input id="gstNumber" name="gstNumber" />
            </Field>

            <Field id="panNumber" label="PAN Number" hint="Required if you don't have a GST number">
              <Input id="panNumber" name="panNumber" />
            </Field>

            <Field id="fssaiNumber" label="FSSAI License Number">
              <Input id="fssaiNumber" name="fssaiNumber" required />
            </Field>

            {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}

            <Button type="submit" disabled={pending} className="mt-2 w-full">
              {pending ? "Submitting..." : "Submit for Review"}
            </Button>
          </form>
        )}

        <a
          href={buildWhatsAppLink("917721881599", KNOW_YOUR_LOGIN_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-green-600 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100"
        >
          Know Your Login
        </a>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have a login?{" "}
          <a href="/shop/login" className="font-medium text-slate-700 underline">
            Sign in
          </a>
        </p>
      </Card>
    </div>
  );
}
