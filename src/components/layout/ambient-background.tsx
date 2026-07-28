/**
 * Repeated wavy stroke used for the topographic contour clusters.
 * Paths extend well past the viewBox (overflow visible) so the outer ends
 * bleed off-screen, and callers apply a mask so the inner ends fade out
 * instead of stopping abruptly mid-page.
 */
function ContourLines({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 900 420"
      overflow="visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {Array.from({ length: 11 }).map((_, i) => (
        <path
          key={i}
          d="M-400 210 C -80 90, 260 330, 480 210 S 780 70, 1300 250"
          stroke="currentColor"
          strokeWidth="2"
          transform={`translate(0 ${i * 26 - 130})`}
        />
      ))}
    </svg>
  );
}

export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <div className="bg-noise absolute inset-0 opacity-60" />

      {/* Soft mesh-gradient orbs — colors come from --orb-* per theme */}
      <div
        className="orb-drift absolute -left-[15%] -top-[20%] size-[55vw] min-h-[420px] min-w-[420px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, var(--orb-1), transparent 70%)" }}
      />
      <div
        className="orb-drift-slow absolute -right-[12%] top-[5%] size-[45vw] min-h-[380px] min-w-[380px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, var(--orb-2), transparent 70%)" }}
      />
      <div
        className="orb-drift absolute -bottom-[25%] left-[20%] size-[50vw] min-h-[400px] min-w-[400px] rounded-full blur-3xl [animation-delay:-20s]"
        style={{ background: "radial-gradient(circle, var(--orb-3), transparent 70%)" }}
      />
      <div
        className="orb-drift-slow absolute bottom-[10%] right-[15%] size-[35vw] min-h-[300px] min-w-[300px] rounded-full blur-3xl [animation-delay:-30s]"
        style={{ background: "radial-gradient(circle, var(--orb-4), transparent 70%)" }}
      />

      {/* Topographic contour accents — bold in light, whisper in dark.
          Masks fade the strokes toward the page interior so they never
          end abruptly mid-page; outer ends bleed off-screen. */}
      <ContourLines className="absolute -left-24 bottom-[-40px] w-[64vw] min-w-[520px] text-[#b97a2e] opacity-60 dark:opacity-[0.08] [mask-image:linear-gradient(to_top_right,black_35%,transparent_72%)]" />
      <ContourLines className="absolute -right-32 top-[-30px] w-[54vw] min-w-[440px] rotate-180 text-[#b97a2e] opacity-50 dark:opacity-[0.07] [mask-image:linear-gradient(to_top_right,black_35%,transparent_72%)]" />
    </div>
  );
}
