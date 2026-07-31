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

      {/* Minimalistic wave lines — sine curves that scroll slowly */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
        style={{ opacity: 0.055 }}
      >
        {/* Each path spans 4 full periods (720px each = 2880px total).
            The animation translates by -720px (one period) for a seamless loop. */}
        <path
          className="wave-line"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          d="M-720,200 C-540,158 -360,242 -180,200 S180,158 360,200 S540,242 720,200 S900,158 1080,200 S1260,242 1440,200 S1620,158 1800,200 S1980,242 2160,200"
          style={{ animation: "wave-flow 22s linear infinite" }}
        />
        <path
          className="wave-line"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          d="M-720,400 C-540,352 -360,448 -180,400 S180,352 360,400 S540,448 720,400 S900,352 1080,400 S1260,448 1440,400 S1620,352 1800,400 S1980,448 2160,400"
          style={{ animation: "wave-flow 30s linear infinite", opacity: 0.7 }}
        />
        <path
          className="wave-line"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          d="M-720,600 C-540,558 -360,642 -180,600 S180,558 360,600 S540,642 720,600 S900,558 1080,600 S1260,642 1440,600 S1620,558 1800,600 S1980,642 2160,600"
          style={{ animation: "wave-flow 38s linear infinite", opacity: 0.5 }}
        />
        <path
          className="wave-line"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          d="M-720,780 C-540,748 -360,812 -180,780 S180,748 360,780 S540,812 720,780 S900,748 1080,780 S1260,812 1440,780 S1620,748 1800,780 S1980,812 2160,780"
          style={{ animation: "wave-flow 50s linear infinite", opacity: 0.35 }}
        />
      </svg>

      <div className="bg-noise absolute inset-0 opacity-[0.35]" />
    </div>
  );
}
