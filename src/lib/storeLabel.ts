/** Prefixes the store's account code so it's easy to find by code. */
export function storeLabel(name: string, externalCode?: string | null): string {
  return externalCode ? `${externalCode} - ${name}` : name;
}
