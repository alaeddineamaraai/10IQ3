export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-background"
    >
      {/* Subtle radial highlight */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 130% 55% at 50% 0%, color-mix(in srgb, var(--foreground) 5%, transparent), transparent 68%)",
        }}
      />

      {/* Randomized wave lines — varied amplitude, period, speed, phase */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
        style={{ opacity: 0.06 }}
      >
        {/* Wave 1 — y≈70, small A=24, tight P≈420, fast */}
        <path className="wave-line" fill="none" stroke="currentColor" strokeWidth="1.0"
          d="M-840,70 C-735,46 -630,94 -525,70 C-420,46 -315,94 -210,70 C-105,46 0,94 105,70 C210,46 315,94 420,70 C525,46 630,94 735,70 C840,46 945,94 1050,70 C1155,46 1260,94 1365,70 C1470,46 1575,94 1680,70 C1785,46 1890,94 1995,70 C2100,46 2205,94 2310,70"
          style={{ animation: "wave-flow 17s linear infinite" }} />

        {/* Wave 2 — y≈185, big A=58, wide P≈820, slow, reversed */}
        <path className="wave-line" fill="none" stroke="currentColor" strokeWidth="1.3"
          d="M-1640,185 C-1435,127 -1230,243 -1025,185 C-820,127 -615,243 -410,185 C-205,127 0,243 205,185 C410,127 615,243 820,185 C1025,127 1230,243 1435,185 C1640,127 1845,243 2050,185 C2255,127 2460,243 2665,185"
          style={{ animation: "wave-flow 41s linear infinite reverse", opacity: 0.6 }} />

        {/* Wave 3 — y≈295, medium A=35, P≈560, medium speed */}
        <path className="wave-line" fill="none" stroke="currentColor" strokeWidth="0.9"
          d="M-1120,295 C-980,260 -840,330 -700,295 C-560,260 -420,330 -280,295 C-140,260 0,330 140,295 C280,260 420,330 560,295 C700,260 840,330 980,295 C1120,260 1260,330 1400,295 C1540,260 1680,330 1820,295 C1960,260 2100,330 2240,295 C2380,260 2520,330 2660,295"
          style={{ animation: "wave-flow 26s linear infinite", opacity: 0.75 }} />

        {/* Wave 4 — y≈390, tiny A=12, short P≈300, very fast */}
        <path className="wave-line" fill="none" stroke="currentColor" strokeWidth="0.7"
          d="M-600,390 C-525,378 -450,402 -375,390 C-300,378 -225,402 -150,390 C-75,378 0,402 75,390 C150,378 225,402 300,390 C375,378 450,402 525,390 C600,378 675,402 750,390 C825,378 900,402 975,390 C1050,378 1125,402 1200,390 C1275,378 1350,402 1425,390 C1500,378 1575,402 1650,390 C1725,378 1800,402 1875,390 C1950,378 2025,402 2100,390 C2175,378 2250,402 2325,390"
          style={{ animation: "wave-flow 13s linear infinite reverse", opacity: 0.45 }} />

        {/* Wave 5 — y≈500, large A=65, very wide P≈960, slowest */}
        <path className="wave-line" fill="none" stroke="currentColor" strokeWidth="1.1"
          d="M-1920,500 C-1680,435 -1440,565 -1200,500 C-960,435 -720,565 -480,500 C-240,435 0,565 240,500 C480,435 720,565 960,500 C1200,435 1440,565 1680,500 C1920,435 2160,565 2400,500 C2640,435 2880,565 3120,500"
          style={{ animation: "wave-flow 55s linear infinite", opacity: 0.5 }} />

        {/* Wave 6 — y≈600, A=30, P≈480, medium-fast, reversed */}
        <path className="wave-line" fill="none" stroke="currentColor" strokeWidth="0.8"
          d="M-960,600 C-840,570 -720,630 -600,600 C-480,570 -360,630 -240,600 C-120,570 0,630 120,600 C240,570 360,630 480,600 C600,570 720,630 840,600 C960,570 1080,630 1200,600 C1320,570 1440,630 1560,600 C1680,570 1800,630 1920,600 C2040,570 2160,630 2280,600 C2400,570 2520,630 2640,600"
          style={{ animation: "wave-flow 22s linear infinite reverse", opacity: 0.55 }} />

        {/* Wave 7 — y≈710, A=42, P≈640, medium, slight phase offset via delay */}
        <path className="wave-line" fill="none" stroke="currentColor" strokeWidth="1.0"
          d="M-1280,710 C-1120,668 -960,752 -800,710 C-640,668 -480,752 -320,710 C-160,668 0,752 160,710 C320,668 480,752 640,710 C800,668 960,752 1120,710 C1280,668 1440,752 1600,710 C1760,668 1920,752 2080,710 C2240,668 2400,752 2560,710 C2720,668 2880,752 3040,710"
          style={{ animation: "wave-flow 32s linear infinite", animationDelay: "-8s", opacity: 0.4 }} />

        {/* Wave 8 — y≈840, A=20, P≈380, fast, bottom edge */}
        <path className="wave-line" fill="none" stroke="currentColor" strokeWidth="0.75"
          d="M-760,840 C-665,820 -570,860 -475,840 C-380,820 -285,860 -190,840 C-95,820 0,860 95,840 C190,820 285,860 380,840 C475,820 570,860 665,840 C760,820 855,860 950,840 C1045,820 1140,860 1235,840 C1330,820 1425,860 1520,840 C1615,820 1710,860 1805,840 C1900,820 1995,860 2090,840 C2185,820 2280,860 2375,840"
          style={{ animation: "wave-flow 20s linear infinite reverse", animationDelay: "-5s", opacity: 0.35 }} />
      </svg>

      <div className="bg-noise absolute inset-0 opacity-[0.35]" />
    </div>
  );
}
