import { twMerge } from "tailwind-merge";

// Plain string-join `clsx` can't tell that a caller's `w-20` is meant to
// replace a component's default `w-full` — both classes survive and
// Tailwind's stylesheet order (not JSX order) decides the winner, which is
// how a shared Input's base `w-full` silently beat a call site's width
// override. twMerge resolves same-property conflicts by keeping the last one.
export function clsx(...values: Array<string | false | null | undefined>): string {
  return twMerge(values.filter(Boolean).join(" "));
}
