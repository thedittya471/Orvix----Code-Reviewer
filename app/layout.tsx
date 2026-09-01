import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";

import { AmbientBackground } from "@/components/effects/ambient-background";

import "./globals.css";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Orvix",
  description: "AI-assisted code and pull request review.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${fontSans.variable} ${fontMono.variable} min-h-svh bg-background text-foreground antialiased`}
      >
        <AmbientBackground />
        <div className="relative z-10 min-h-svh">{children}</div>
      </body>
    </html>
  );
}
