import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Prewarmer from "@/app/partials/prewarmer";
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
  title: "Sentinel Security | Identity, Device & Access Management",
  description: "Comprehensive access security strategies for an integrated future.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Prewarmer />
        {children}
      </body>
    </html>
  );
}
