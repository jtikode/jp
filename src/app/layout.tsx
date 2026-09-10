import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { BrandBar } from "@/components/BrandBar";
import { BrandFooter } from "@/components/BrandFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "J P Traders",
  description: "Field terminal, telecalling, warehouse and admin operations hub for pharma distributors.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d4ed8",
  // Default Android behavior only resizes the *visual* viewport for the
  // on-screen keyboard, leaving the layout viewport (and anything `fixed`
  // to it, like the shop's bottom nav) sized to the full screen — so a
  // fixed nav ends up floating mid-screen, above the keyboard, instead of
  // pinned to the bottom of what's actually visible. This makes the layout
  // viewport itself shrink with the keyboard so `fixed`/`100dvh` stay correct.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        <BrandBar />
        <div className="flex flex-1 flex-col">{children}</div>
        <BrandFooter />
      </body>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}
