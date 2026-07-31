import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, Mail, Sparkles, Users, UserCircle2, Search, Send } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { CountUp } from "@/components/count-up";


const STATS = [
  { label: "College coaches", value: "1,800+" },
  { label: "Divisions covered", value: "D1–JUCO" },
  { label: "Emails personalized", value: "10k+" },
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
    title: "Bulk compose",
    description: "Select dozens of coaches at once and draft personalized intros in minutes.",
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
        <nav className="hidden items-center gap-6 text-sm sm:flex" style={{ color: "rgba(255,255,255,0.78)" }}>
          <a href="#how-it-works" className="transition-opacity hover:opacity-100">How it works</a>
          <a href="#features" className="transition-opacity hover:opacity-100">Features</a>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/auth" className="hidden text-sm transition-opacity hover:opacity-100 sm:block" style={{ color: "rgba(255,255,255,0.78)" }}>
            Sign in
          </Link>
          <Link
            href="/auth"
            className={buttonVariants({ size: "sm" })}
            style={{ background: "white", color: "#1a2e1a" }}
          >
            Get started free
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────── */}
        <section
          className="relative flex min-h-screen overflow-hidden"
          style={{
            backgroundImage: "url(/hero-court.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Subtle veil over full image */}
          <div aria-hidden style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.12)" }} />
          {/* Bottom fade into stats */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: "auto 0 0",
              height: "10rem",
              background: "linear-gradient(to top, var(--background), transparent)",
            }}
          />

          {/* Left panel — full height, edge-to-edge, dark glass */}
          <div
            className="relative z-10 flex w-full flex-col justify-center px-8 py-24 sm:px-12 lg:w-[52%] lg:px-16"
            style={{ background: "rgba(0,0,0,0.44)", backdropFilter: "blur(10px)" }}
          >
            <div className="max-w-lg">
              <span
                className="mb-6 block text-xs font-normal text-white/50"
                style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "0.2em" }}
              >
                NETSET
              </span>

              <h1
                className="font-semibold text-white"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: "clamp(30px, 4.5vw, 76px)",
                  lineHeight: 1.05,
                  textShadow: "0 2px 20px rgba(0,0,0,0.4)",
                  marginBottom: "20px",
                }}
              >
                Get Recruited by College Tennis Coaches
              </h1>

              <p
                className="text-sm sm:text-base"
                style={{ color: "rgba(255,255,255,0.72)", marginBottom: "36px" }}
              >
                Match with 1,800+ college coaches and send personalized recruiting emails in minutes.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth"
                  className={buttonVariants({ size: "lg" })}
                  style={{ background: "white", color: "#1a2e1a", fontWeight: 600 }}
                >
                  Start Free
                </Link>
                <Link
                  href="/dashboard"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  style={{ borderColor: "rgba(255,255,255,0.4)", color: "white", background: "rgba(255,255,255,0.06)" }}
                >
                  Watch Demo →
                </Link>
              </div>
            </div>
          </div>

          {/* Right — court shows through */}
          <div className="hidden flex-1 lg:block" />
        </section>

        {/* ── Stats bar ──────────────────────────────────────── */}
        <section className="relative z-10 -mt-6 px-4 pb-20 sm:px-6">
          <div className="scroll-reveal mx-auto grid max-w-3xl grid-cols-2 overflow-hidden rounded-2xl bg-background shadow-xl sm:grid-cols-4">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className={[
                  "flex flex-col items-center gap-1 py-6 sm:py-8 text-center",
                  // mobile 2-col: border-b between rows, border-r inside each row
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
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-primary">
              How it works
            </p>
            <h2 className="mb-12 text-center text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              From profile to inbox in minutes
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step) => (
                <div
                  key={step.step}
                  className="glass-card scroll-reveal group flex flex-col gap-4 p-6 transition-smooth hover:-translate-y-1 hover:shadow-xl"
                >
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
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-primary">
              Features
            </p>
            <h2 className="mb-12 text-center text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Everything you need to get recruited
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="glass-card scroll-reveal group flex flex-col gap-3 p-5 transition-smooth hover:-translate-y-1 hover:shadow-xl"
                >
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

        {/* ── Closing CTA ────────────────────────────────────── */}
        <section className="px-6 pb-24 sm:px-10">
          <div className="glass-card scroll-reveal mx-auto flex max-w-3xl flex-col items-center gap-5 p-10 text-center">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Ready to get recruited?
            </h2>
            <p className="max-w-md text-muted-foreground">
              Create your free account, build your profile, and start reaching coaches today.
              No credit card required.
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
              <p className="text-sm text-muted-foreground">
                AI-powered recruiting outreach for student tennis athletes.
              </p>
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
