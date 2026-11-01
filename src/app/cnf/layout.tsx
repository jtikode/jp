import type { Metadata } from "next";

// Overrides the root manifest for everything under /cnf — this is the manifest
// the distributor Android TWA (bubblewrap) build points at.
export const metadata: Metadata = {
  manifest: "/cnf-manifest.webmanifest",
};

export default function CnfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
