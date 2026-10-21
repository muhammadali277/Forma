import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "forma. | Your leaner era",
  description: "A practical lean body recomposition dashboard for desi meals, training, progress and recovery.",
  applicationName: "forma",
  appleWebApp: { capable: true, title: "forma", statusBarStyle: "default" },
  icons: { icon: "/icon-512.png", apple: "/icon-512.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#193e34",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
