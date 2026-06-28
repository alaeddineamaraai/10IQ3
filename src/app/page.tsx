import Link from "next/link";
import { BarChart3, Mail, Sparkles, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import MacbookScrollDemo from "@/components/macbook-scroll-demo";

const STATS = [
  { label: "College coaches", value: "1,800+" },
  { label: "Divisions covered", value: "D1–JUCO" },
  { label: "AI-personalized", value: "100%" },
  { label: "Free emails to start", value: "5" },
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
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-lg font-semibold tracking-tight">Netset</span>
        <Link href="/auth" className={buttonVariants({ variant: "ghost" })}>
          Sign in
        </Link>
      </header>

      <main className="flex-1">
        <section className="flex flex-col items-center gap-6 px-6 pt-12 pb-20 text-center sm:px-10">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Get recruited by college tennis coaches —{" "}
            <span className="text-primary">faster</span>
          </h1>
          <p className="max-w-xl text-balance text-muted-foreground sm:text-lg">
            Netset writes AI-personalized recruiting emails to college tennis coaches using
            your real stats, so you can reach more programs without starting from a blank page.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth" className={buttonVariants({ size: "lg" })}>
              Get started free
            </Link>
            <Link href="/auth" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Sign in
            </Link>
          </div>
        </section>

        <section>
          <MacbookScrollDemo />
        </section>

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

        <section className="px-6 pb-24 sm:px-10">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground sm:px-10">
        © {new Date().getFullYear()} Netset. Built for student athletes.
      </footer>
    </div>
  );
}
