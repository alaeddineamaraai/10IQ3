import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, Mail, Sparkles, Users, UserCircle2, Search, Send, Star } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { CountUp } from "@/components/count-up";

const STATS = [
  { label: "College coaches", value: "1,800+" },
  { label: "College offers secured", value: "14" },
  { label: "Average open rate", value: "42%" },
  { label: "Free to start", value: "$0" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: UserCircle2,
    title: "Build your profile",
    description: "Add your UTR, WTN, graduation year, and highlights once — Netset uses them in every email.",
  },
  {
    step: "02",
    icon: Search,
    title: "Browse 1,800+ coaches",
    description: "Filter by division, region, and program fit to build your target list fast.",
  },
  {
    step: "03",
    icon: Send,
    title: "AI drafts, you send",
    description: "Get a personalized intro email for each coach in seconds. Review, tweak, send.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-personalized emails",
    description:
      "Every email references your actual UTR, record, and the coach's program — not a generic template.",
  },
  {
    icon: Users,
    title: "1,800+ college coaches",
    description: "Browse and filter by division, region, UTR, and WTN across every level.",
  },
  {
    icon: BarChart3,
    title: "Outreach analytics",
    description: "Track sent, opened, and replied rates so you know what's actually working.",
  },
  {
    icon: Mail,
    title: "Schedule & bulk send",
    description: "Build lists, schedule sends for peak open times, and reach dozens of coaches in minutes.",
  },
];

const TESTIMONIALS = [
  {
    quote: "I sent 23 emails in one afternoon and had three coaches respond within 48 hours. The personalization is what made it work — it didn't read like a mass email at all.",
    name: "Sofia R.",
    detail: "2026 · D1 commit · University of Tennessee",
    rating: 5,
  },
  {
    quote: "My daughter was getting no responses writing emails herself. Two weeks on Netset and she had her first campus visit scheduled. The open tracking alone changed how we approached follow-ups.",
    name: "Parent of a 2027 recruit",
    detail: "D2 offer · Belmont University",
    rating: 5,
  },
  {
    quote: "I had no idea how to reach out to coaches. Netset made it feel doable — I picked my schools, hit generate, and had real conversations going within a week.",
    name: "Marcus T.",
    detail: "2025 · NAIA commit · Freed-Hardeman University",
    rating: 5,
  },
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  if (params.error) {
    const desc = params.error_description
      ? decodeURIComponent(params.error_description)
      : "Sign-in failed. Please try again.";
    redirect(`/auth?error=${encodeURIComponent(desc)}`);
  }

  return (
    <div className="flex min-h-screen flex-col">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 sm:px-10"
        style={{ background: "rgba(0,0,0,0.18)", backdropFilter: "blur(8px)" }}
      >
        <Link href="/" className="flex items-center gap-2 sm:hidden" aria-label="Netset home">
          <span className="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ background: "#197a48" }}>N</span>
          <span className="text-sm font-semibold text-white">Netset</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm sm:flex" style={{ color: "rgba(255,255,255,0.78)" }}>
          <a href="#how-it-works" className="transition-opacity hover:opacity-100">How it works</a>
          <a href="#features" className="transition-opacity hover:opacity-100">Features</a>
          <a href="#testimonials" className="transition-opacity hover:opacity-100">Stories</a>
        </nav>
        <div className="flex items-center gap-3 sm:ml-auto">
          <Link href="/auth" className="text-sm transition-opacity hover:opacity-100 sm:block" style={{ color: "rgba(255,255,255,0.78)" }}>
            Sign in
          </Link>
          <Link href="/auth" className={buttonVariants({ size: "sm" })} style={{ background: "white", color: "#1a2e1a" }}>
            Get started free
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────── */}
        <section
          className="flex min-h-screen items-center overflow-hidden"
          style={{
            backgroundImage: "url(/hero-court.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "30% center",
            position: "relative",
          }}
        >
          <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,.58) 0%, rgba(0,0,0,.38) 30%, rgba(0,0,0,.10) 60%, rgba(0,0,0,0) 100%)" }} />
          <div aria-hidden style={{ position: "absolute", inset: "auto 0 0", height: "12rem", background: "linear-gradient(to top, var(--background), transparent)" }} />

          <div className="relative w-full px-4 sm:px-8 lg:px-14" style={{ zIndex: 10, maxWidth: "680px" }}>
            <div className="flex flex-col rounded-2xl p-5 sm:p-8" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(10px)" }}>
              <span className="mb-5 sm:mb-7 text-xs font-normal text-white/55" style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "0.2em" }}>
                NETSET
              </span>

              <h1 className="font-semibold text-white" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "clamp(30px, 5.5vw, 54px)", lineHeight: 1.05, textShadow: "0 2px 16px rgba(0,0,0,0.3)", marginBottom: "20px" }}>
                Get Recruited by College Tennis Coaches
              </h1>

              <p className="text-sm sm:text-base" style={{ color: "rgba(255,255,255,0.78)", marginBottom: "32px", maxWidth: "420px" }}>
                Match with 1,800+ college coaches and send AI-personalized recruiting emails in minutes. 14 athletes already have offers.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/auth" className={buttonVariants({ size: "lg" })} style={{ background: "white", color: "#1a2e1a", fontWeight: 600 }}>
                  Start Free
                </Link>
                <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "lg" })} style={{ borderColor: "rgba(255,255,255,0.45)", color: "white", background: "rgba(255,255,255,0.06)" }}>
                  Watch Demo →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ──────────────────────────────────────── */}
        <section className="relative z-10 -mt-6 px-4 pb-20 sm:px-6">
          <div className="scroll-reveal mx-auto grid max-w-3xl grid-cols-2 overflow-hidden rounded-2xl bg-background shadow-xl sm:grid-cols-4">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className={[
                  "flex flex-col items-center gap-1 py-6 sm:py-8 text-center",
                  i === 0 ? "border-b border-r border-border/40 sm:border-b-0" : "",
                  i === 1 ? "border-b border-border/40 sm:border-b-0 sm:border-r" : "",
                  i === 2 ? "sm:border-r border-border/40" : "",
                ].join(" ")}
              >
                <span className="text-2xl font-semibold tracking-tight text-primary">
                  <CountUp value={stat.value} />
                </span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────── */}
        <section id="how-it-works" className="px-6 pb-24 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-primary">How it works</p>
            <h2 className="mb-12 text-center text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">From profile to inbox in minutes</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step) => (
                <div key={step.step} className="glass-card scroll-reveal group flex flex-col gap-4 p-6 transition-smooth hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-primary/20">{step.step}</span>
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <step.icon className="size-4.5" />
                    </div>
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────── */}
        <section id="features" className="px-6 pb-24 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-primary">Features</p>
            <h2 className="mb-12 text-center text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">Everything you need to get recruited</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="glass-card scroll-reveal group flex flex-col gap-3 p-5 transition-smooth hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <feature.icon className="size-4.5" />
                  </div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ───────────────────────────────────── */}
        <section id="testimonials" className="px-6 pb-24 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-primary">Success stories</p>
            <h2 className="mb-12 text-center text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">Athletes who got recruited</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="glass-card scroll-reveal flex flex-col gap-4 p-6">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing CTA ────────────────────────────────────── */}
        <section className="px-6 pb-24 sm:px-10">
          <div className="glass-card scroll-reveal mx-auto flex max-w-3xl flex-col items-center gap-5 p-10 text-center">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">Ready to get recruited?</h2>
            <p className="max-w-md text-muted-foreground">
              Create your free account, build your profile, and start reaching coaches today. No credit card required.
            </p>
            <Link href="/auth" className={buttonVariants({ size: "lg" })}>
              Start for free →
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border/40 px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <span className="font-semibold">Netset</span>
              <p className="text-sm text-muted-foreground">AI-powered recruiting outreach for student tennis athletes.</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Product</span>
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
                <a href="#features" className="transition-colors hover:text-foreground">Features</a>
                <Link href="/paywall" className="transition-colors hover:text-foreground">Pricing</Link>
                <Link href="/auth" className="transition-colors hover:text-foreground">Sign up free</Link>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Legal</span>
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</Link>
                <Link href="/terms" className="transition-colors hover:text-foreground">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Netset. Built for student athletes.
          </div>
        </div>
      </footer>
    </div>
  );
}
