export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-background"
    >
      {/* Subtle radial highlight — lifts the center slightly, adds depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 130% 55% at 50% 0%, color-mix(in srgb, var(--foreground) 5%, transparent), transparent 68%)",
        }}
      />
      <div className="bg-noise absolute inset-0 opacity-[0.35]" />
    </div>
  );
}
