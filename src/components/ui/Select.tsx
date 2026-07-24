import type { SelectHTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "min-h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-lg bg-white",
        "focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
