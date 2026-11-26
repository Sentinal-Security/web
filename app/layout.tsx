import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import BackendGuard from "@/components/BackendGuard";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sentinel Security | Identity, Device & Access Management",
  description: "Comprehensive access security strategies for an integrated future.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-page text-ink-primary transition-colors">
        <ThemeProvider>
          <BackendGuard>{children}</BackendGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
