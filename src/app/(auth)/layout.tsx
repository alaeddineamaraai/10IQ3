import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <ThemeToggle className="absolute right-4 top-4" />
      {children}
      <Link
        href="/privacy"
        className="text-xs text-muted-foreground transition-smooth hover:text-foreground hover:underline"
      >
        Privacy Policy
      </Link>
    </div>
  );
}
