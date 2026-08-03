import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { GlassCard, GlassCardContent } from "@/components/glass-card";

const EFFECTIVE_DATE = "June 29, 2026";

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "What we collect",
    body: (
      <>
        <p>When you create an account, we collect your email address and the recruiting profile you fill in during onboarding (graduation year, GPA, UTR/WTN, playing record, target division and region, highlight video link, and similar fields). You provide this directly — we don&apos;t buy or scrape personal data about you from anywhere else.</p>
        <p>When you send outreach emails through Netset, we store the coach&apos;s email address, the subject and body of what was sent, and delivery signals (sent, opened, replied, and the content of any reply) so your dashboard can show accurate outreach history.</p>
        <p>If you upgrade to a paid plan, payment is handled entirely by Stripe — we never see or store your card number. We keep a reference to your Stripe customer ID so billing can be managed from your account.</p>
      </>
    ),
  },
  {
    title: "How we use it",
    body: (
      <p>
        Your profile data is used to personalize the outreach emails you send and to power the AI Advisor chat. Outreach
        history (sent/opened/replied) is used to build your dashboard analytics. We do not use your data to train AI
        models, and we do not sell your data to anyone.
      </p>
    ),
  },
  {
    title: "Who we share it with",
    body: (
      <>
        <p>We use a small number of service providers to run Netset, each only with the data they need to do their job:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Supabase</strong> — hosts our database and handles authentication.</li>
          <li><strong>Resend</strong> — delivers your outreach emails and reports back open/reply events.</li>
          <li><strong>Stripe</strong> — processes payments for paid plans.</li>
          <li><strong>Anthropic (Claude) and Google (Gemini)</strong> — generate AI-drafted email text and Advisor replies from the profile details and prompts you provide. We don&apos;t share your full account record with them, only what&apos;s needed to generate that specific draft or reply.</li>
          <li><strong>Vercel</strong> — hosts the application itself.</li>
        </ul>
        <p>We don&apos;t share your information with coaches or schools beyond what you explicitly send them in an outreach email.</p>
      </>
    ),
  },
  {
    title: "Data retention",
    body: (
      <p>
        We keep your account and outreach history for as long as your account is active, so your dashboard stays
        accurate over time. If you delete your account, we delete your profile and outreach data within 30 days,
        except where we&apos;re required to retain billing records for legal or tax purposes.
      </p>
    ),
  },
  {
    title: "Your rights",
    body: (
      <p>
        You can view and edit your profile at any time from the account menu. To request a full export or deletion of
        your data, email us at the address below — we&apos;ll respond within 30 days.
      </p>
    ),
  },
  {
    title: "Cookies",
    body: (
      <>
        <p>We use a small number of strictly necessary cookies. We do not use advertising or third-party tracking cookies.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-foreground">
                <th className="pb-2 pr-4 font-semibold">Cookie</th>
                <th className="pb-2 pr-4 font-semibold">Type</th>
                <th className="pb-2 pr-4 font-semibold">Purpose</th>
                <th className="pb-2 pr-4 font-semibold">Duration</th>
                <th className="pb-2 font-semibold">How to opt out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-2 pr-4 font-mono">sb-*-auth-token</td>
                <td className="py-2 pr-4">Essential</td>
                <td className="py-2 pr-4">Keeps you signed in (Supabase Auth session)</td>
                <td className="py-2 pr-4">Session / up to 1 week</td>
                <td className="py-2">Sign out, or clear site data in your browser settings — note this will sign you out</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">sb-*-auth-token-code-verifier</td>
                <td className="py-2 pr-4">Essential</td>
                <td className="py-2 pr-4">PKCE code verifier for OAuth sign-in security</td>
                <td className="py-2 pr-4">Session</td>
                <td className="py-2">Deleted automatically after sign-in completes</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Netset does not currently respond to Do Not Track (DNT) browser signals, as no uniform standard for DNT
          exists. You can manage or delete cookies at any time through your browser settings — instructions for{" "}
          <a className="text-primary hover:underline" href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a>,{" "}
          <a className="text-primary hover:underline" href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer">Firefox</a>,{" "}
          <a className="text-primary hover:underline" href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a>, and{" "}
          <a className="text-primary hover:underline" href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Edge</a>.
          Disabling essential cookies will sign you out and prevent you from using the Service.
        </p>
      </>
    ),
  },
  {
    title: "Children's privacy",
    body: (
      <p>
        Netset is built for student-athletes, who are often minors. We collect only the recruiting information needed
        to send outreach on your behalf and do not knowingly collect more than that. If you&apos;re a parent or
        guardian with questions about a minor&apos;s account, contact us at the address below.
      </p>
    ),
  },
  {
    title: "Security",
    body: (
      <p>
        All data is transmitted over HTTPS/TLS. Data at rest is encrypted by Supabase (AES-256). We do not store
        your payment card details — payments are processed entirely by PayPal. In the event of a data breach that
        affects your personal information, we will notify you by email within a reasonable time and, where required
        by law, within 72 hours of becoming aware of the breach.
      </p>
    ),
  },
  {
    title: "International transfers",
    body: (
      <p>
        Netset is operated from the United States. Your data is stored and processed in the US by Supabase (hosted
        on AWS). If you access the Service from the European Economic Area, UK, or other regions with data-transfer
        restrictions, your information may be transferred to and processed in the US. By using the Service, you
        consent to this transfer. We rely on standard contractual clauses and, where applicable, adequacy decisions
        as the legal mechanism for such transfers.
      </p>
    ),
  },
  {
    title: "Changes to this policy",
    body: (
      <p>
        If we make material changes to this policy, we&apos;ll update the effective date below and, where required,
        notify you directly.
      </p>
    ),
  },
  {
    title: "California residents (CCPA)",
    body: (
      <p>
        Netset does not sell or share personal information as defined under the California Consumer Privacy Act
        (CCPA/CPRA). California residents have the right to know what personal information we collect, request
        deletion of their data, and opt out of any sale or sharing (none occurs). To exercise these rights, email{" "}
        <a className="text-primary hover:underline" href="mailto:privacy@netset.pro">
          privacy@netset.pro
        </a>
        . We will respond within 45 days.
      </p>
    ),
  },
  {
    title: "Contact",
    body: (
      <p>
        Questions about this policy or your data? Email{" "}
        <a className="text-primary hover:underline" href="mailto:privacy@netset.pro">
          privacy@netset.pro
        </a>
        . We respond within 30 days.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
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
            <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
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
        © {new Date().getFullYear()} Netset. Built for student athletes. ·{" "}
        <Link href="/terms" className="hover:underline">Terms of Service</Link>
      </footer>
    </div>
  );
}
