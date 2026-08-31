/** The shop login password is always this login code's digits reversed. */
export function shopLoginPassword(loginCode: string): string {
  return [...loginCode].reverse().join("");
}
