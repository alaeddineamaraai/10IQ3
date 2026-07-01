import Link from "next/link";
import { BarChart3, Mail, Sparkles, Users, UserCircle2, Search, Send } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

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

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/20 bg-background/20 px-6 py-4 backdrop-blur-xl sm:px-10">
        <Link href="/" className="text-lg font-semibold tracking-tight transition-opacity hover:opacity-70">
          Netset
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/auth" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">
            Sign in
          </Link>
          <Link href="/auth" className={buttonVariants({ size: "sm" })}>
            Get started free
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="flex flex-col items-center gap-6 px-6 pb-16 pt-16 text-center sm:px-10 sm:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-green-500" />
            Now with AI-personalized outreach for every coach
          </div>

          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Get recruited by college tennis coaches —{" "}
            <span className="text-primary">faster</span>
          </h1>

          <p className="max-w-lg text-balance text-muted-foreground sm:text-lg">
            AI writes personalized outreach emails to 1,800+ coaches using your real stats.
            You just hit send.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/auth" className={buttonVariants({ size: "lg" })}>
              Get started free
            </Link>
            <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Try live demo →
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex -space-x-2">
              {["#3b7af5","#7c3aed","#22c55e","#f59e0b"].map((color) => (
                <div
                  key={color}
                  className="size-6 rounded-full border-2 border-background"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span>Joined by student athletes across the country</span>
          </div>
        </section>

        {/* ── Stats bar ──────────────────────────────────────── */}
        <section className="px-6 pb-20 sm:px-10">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
                <span className="text-2xl font-semibold tracking-tight text-primary">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────── */}
        <section id="how-it-works" className="px-6 pb-24 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
              How it works
            </p>
            <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              From profile to inbox in minutes
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step) => (
                <div key={step.step} className="glass-card flex flex-col gap-4 p-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-primary/20">{step.step}</span>
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Features
            </p>
            <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything you need to get recruited
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="glass-card flex flex-col gap-3 p-5">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
          <div className="glass-card mx-auto flex max-w-3xl flex-col items-center gap-5 p-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
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
                <Link href="/auth" className="transition-colors hover:text-foreground">Sign up free</Link>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Legal</span>
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</Link>
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
