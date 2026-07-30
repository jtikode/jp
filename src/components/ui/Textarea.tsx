import type { TextareaHTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-xl border-2 border-slate-300 p-3 text-base",
        "text-slate-900 placeholder:text-slate-800",
        "focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200",
        className,
      )}
      {...props}
    />
  );
}
