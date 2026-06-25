import { BottomDock } from "@/components/layout/bottom-dock";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-4 pb-32 pt-6 sm:px-6 lg:px-10">{children}</main>
      <BottomDock />
    </div>
  );
}
