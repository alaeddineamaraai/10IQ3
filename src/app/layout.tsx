import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AmbientBackground } from "@/components/layout/ambient-background";
import { AuthHashHandler } from "@/components/auth/auth-hash-handler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "10IQ — College Tennis Recruiting",
  description:
    "AI-personalized recruiting emails to 1,800+ college tennis coaches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AmbientBackground />
        <AuthHashHandler />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
