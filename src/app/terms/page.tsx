import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { GlassCard, GlassCardContent } from "@/components/glass-card";

const EFFECTIVE_DATE = "July 3, 2026";

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Acceptance",
    body: (
      <p>
        By creating an account or using Netset (&quot;Service&quot;), you agree to these Terms of Service. If you
        do not agree, do not use the Service. Use by minors requires consent from a parent or guardian.
      </p>
    ),
  },
  {
    title: "What Netset does",
    body: (
      <p>
        Netset is a recruiting tool for student-athletes. It lets you build a recruiting profile, draft personalized
        outreach emails with AI assistance, track your outreach history, and chat with an AI advisor about your
        recruiting process. Netset does not guarantee admission, recruitment, or any outcome with any college program.
      </p>
    ),
  },
  {
    title: "Your account",
    body: (
      <>
        <p>
          You are responsible for keeping your login credentials secure and for all activity that occurs under your
          account. Notify us immediately at{" "}
          <a className="text-primary hover:underline" href="mailto:support@netset.pro">
            support@netset.pro
          </a>{" "}
          if you suspect unauthorized access.
        </p>
        <p>
          You must provide accurate information when creating your account. Accounts created with false information may
          be suspended.
        </p>
      </>
    ),
  },
  {
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Use Netset to send spam, harass anyone, or send emails on behalf of someone other than yourself.</li>
          <li>Attempt to circumvent rate limits, quotas, or plan restrictions.</li>
          <li>Reverse-engineer, scrape, or copy the Service or its underlying data.</li>
          <li>Upload or submit content that is unlawful, defamatory, or infringes third-party rights.</li>
          <li>Use the AI features to generate content intended to deceive coaches about your identity or qualifications.</li>
        </ul>
        <p>
          We reserve the right to suspend accounts that violate these rules without notice or refund.
        </p>
      </>
    ),
  },
  {
    title: "Outreach emails and CAN-SPAM",
    body: (
      <p>
        You are the sender of record for all outreach emails dispatched through Netset. You are responsible for
        complying with applicable email laws, including CAN-SPAM, CASL, and GDPR where they apply to you.
        Netset automatically appends a compliance footer and opt-out mechanism to every outbound email to help you
        meet these requirements; you must not remove or alter that footer.
      </p>
    ),
  },
  {
    title: "AI-generated content",
    body: (
      <p>
        The AI drafts and advisor replies are generated automatically and may contain errors, inaccuracies, or
        outdated information. Always review AI-generated content before sending it. You are solely responsible for
        the emails you send, regardless of how they were drafted.
      </p>
    ),
  },
  {
    title: "Paid plans and billing",
    body: (
      <>
        <p>
          Paid plan fees are billed in advance on a monthly basis via Stripe. All fees are in USD and are
          non-refundable except as required by law or at our sole discretion. Cancellation takes effect at the end
          of the current billing period — you retain access until then.
        </p>
        <p>
          We may change plan pricing on 30 days&apos; notice. Continued use after the effective date constitutes
          acceptance of the new pricing.
        </p>
      </>
    ),
  },
  {
    title: "Intellectual property",
    body: (
      <p>
        Netset and its underlying technology are owned by us. You retain ownership of the recruiting profile
        data and email content you create. You grant us a limited license to use your data to operate and improve
        the Service, consistent with our{" "}
        <Link className="text-primary hover:underline" href="/privacy">
          Privacy Policy
        </Link>
        .
      </p>
    ),
  },
  {
    title: "Disclaimers",
    body: (
      <p>
        The Service is provided &quot;as is&quot; without warranty of any kind. We do not warrant that it will be
        error-free, uninterrupted, or that any particular outcome will result from using it. To the maximum extent
        permitted by law, we disclaim all implied warranties including merchantability and fitness for a particular
        purpose.
      </p>
    ),
  },
  {
    title: "Limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, Netset&apos;s total liability to you for any claim arising out of
        or relating to these Terms or the Service shall not exceed the amount you paid us in the three months
        preceding the claim. We are not liable for indirect, incidental, or consequential damages of any kind.
      </p>
    ),
  },
  {
    title: "Termination",
    body: (
      <p>
        You may delete your account at any time from the Settings page. We may terminate or suspend your account
        for violation of these Terms or for any reason with reasonable notice, except that accounts engaging in
        abuse may be terminated immediately.
      </p>
    ),
  },
  {
    title: "Governing law",
    body: (
      <p>
        These Terms are governed by the laws of the State of California, without regard to conflict-of-law
        principles. Disputes shall be resolved in the courts located in San Francisco County, California, and you
        consent to personal jurisdiction there.
      </p>
    ),
  },
  {
    title: "Changes to these Terms",
    body: (
      <p>
        We may update these Terms from time to time. Material changes will be communicated via email or an
        in-app notice at least 14 days before they take effect. Continued use after that date constitutes
        acceptance.
      </p>
    ),
  },
  {
    title: "Contact",
    body: (
      <p>
        Questions about these Terms? Email{" "}
        <a className="text-primary hover:underline" href="mailto:legal@netset.pro">
          legal@netset.pro
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Netset
        </Link>
        <Link href="/auth" className={buttonVariants({ variant: "ghost" })}>
          Sign in
        </Link>
      </header>

      <main className="flex-1 px-6 pb-24 sm:px-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
            <p className="mt-1 text-sm text-muted-foreground">Effective {EFFECTIVE_DATE}</p>
          </div>

          <GlassCard>
            <GlassCardContent className="flex flex-col gap-8 p-6 text-sm leading-relaxed text-muted-foreground sm:p-8">
              {SECTIONS.map((section) => (
                <div key={section.title} className="flex flex-col gap-2">
                  <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
                  <div className="flex flex-col gap-2 [&_a]:font-medium [&_strong]:text-foreground">
                    {section.body}
                  </div>
                </div>
              ))}
            </GlassCardContent>
          </GlassCard>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground sm:px-10">
        © {new Date().getFullYear()} Netset. Built for student athletes.
      </footer>
    </div>
  );
}
