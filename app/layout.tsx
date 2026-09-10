import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";

import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";

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

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} min-h-svh bg-background text-foreground antialiased`}
      >
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            {children}
            <Toaster richColors position="top-center" />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

export default RootLayout
