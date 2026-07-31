import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12"
      style={{
        minHeight: "var(--full-h, 100vh)",
        backgroundImage: "url(/hero-court.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Blurred dark overlay — hides image quality, improves card contrast */}
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.48)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }} />
      <div className="relative z-10 flex flex-col items-center gap-6 w-full">
        {children}
        <Link
          href="/privacy"
          className="text-xs transition-smooth hover:underline"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
