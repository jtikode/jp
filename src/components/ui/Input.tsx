import type { InputHTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "min-h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-lg",
        "text-slate-900 placeholder:text-slate-800",
        "focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200",
        className,
      )}
      {...props}
    />
  );
}
