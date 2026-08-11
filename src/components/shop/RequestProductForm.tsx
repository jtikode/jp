"use client";

import { useActionState } from "react";
import { requestProduct } from "@/actions/requestedProductActions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { t, type Lang } from "@/lib/i18n";

const initialState = { ok: false, error: undefined };

export function RequestProductForm({ lang }: { lang: Lang }) {
  const [state, formAction, pending] = useActionState(requestProduct, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t(lang, "shop_product_name")}
        </label>
        <Input name="productName" required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{t(lang, "shop_note_optional")}</label>
        <Textarea name="note" rows={3} />
      </div>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm font-medium text-green-700">{t(lang, "shop_request_sent")}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t(lang, "shop_sending") : t(lang, "shop_send_request")}
      </Button>
    </form>
  );
}
