"use server";

import { z } from "zod";
import { sendRegistrationEmail } from "@/lib/registrationEmail";

const registrationSchema = z
  .object({
    medicalName: z.string().trim().min(1, "Medical/shop name is required."),
    ownerName: z.string().trim().min(1, "Owner name is required."),
    whatsappNumber: z.string().trim().min(10, "Enter a valid WhatsApp number."),
    email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
    drugLicense20B: z.string().trim().min(1, "Drug license (20-B) is required."),
    drugLicense21B: z.string().trim().min(1, "Drug license (21-B) is required."),
    licenseExpiry: z.string().trim().min(1, "License expiry date is required."),
    gstNumber: z.string().trim().optional().or(z.literal("")),
    panNumber: z.string().trim().optional().or(z.literal("")),
    fssaiNumber: z.string().trim().min(1, "FSSAI license number is required."),
  })
  .refine((data) => data.gstNumber || data.panNumber, {
    message: "Enter your GST number, or your PAN if you don't have GST.",
    path: ["panNumber"],
  });

export interface RegistrationState {
  ok: boolean;
  error?: string;
}

export async function submitShopRegistration(
  _prev: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const parsed = registrationSchema.safeParse({
    medicalName: formData.get("medicalName"),
    ownerName: formData.get("ownerName"),
    whatsappNumber: formData.get("whatsappNumber"),
    email: formData.get("email"),
    drugLicense20B: formData.get("drugLicense20B"),
    drugLicense21B: formData.get("drugLicense21B"),
    licenseExpiry: formData.get("licenseExpiry"),
    gstNumber: formData.get("gstNumber"),
    panNumber: formData.get("panNumber"),
    fssaiNumber: formData.get("fssaiNumber"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  try {
    await sendRegistrationEmail({
      ...parsed.data,
      email: parsed.data.email || undefined,
      gstNumber: parsed.data.gstNumber || undefined,
      panNumber: parsed.data.panNumber || undefined,
    });
  } catch {
    return { ok: false, error: "Could not submit your details right now. Please try again shortly." };
  }

  return { ok: true };
}
