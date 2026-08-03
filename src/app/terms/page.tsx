import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { GlassCard, GlassCardContent } from "@/components/glass-card";

const EFFECTIVE_DATE = "August 3, 2026";

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    body: (
      <>
        <p>
          These Terms of Service (&quot;Terms&quot;) form a legally binding agreement between you and Netset
          (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your access to and use of
          the Netset platform and related services (collectively, the &quot;Service&quot;).
        </p>
        <p>
          By creating an account, clicking &quot;Create account,&quot; or otherwise using the Service, you confirm that
          you have read, understood, and agree to be bound by these Terms and our{" "}
          <Link className="text-primary hover:underline" href="/privacy">
            Privacy Policy
          </Link>
          . If you do not agree, do not use the Service.
        </p>
        <p>
          Our mailing address for legal correspondence is: Netset · 424 Senator Street, Apt 15.
        </p>
      </>
    ),
  },
  {
    id: "service",
    title: "2. Service Description",
    body: (
      <p>
        Netset is a recruiting assistance platform for student-athletes. The Service includes tools to build a
        recruiting profile, draft personalized outreach emails using AI, manage an outreach history dashboard, and
        interact with an AI advisor. The Service does not employ human coaches or recruiters and does not act as an
        agent or representative for any university or athletic program.
      </p>
    ),
  },
  {
    id: "age",
    title: "3. Age Requirements",
    body: (
      <p>
        You must be at least 13 years old to create an account or use the Service. If you are under 18, you represent
        that your parent or legal guardian has reviewed and agreed to these Terms on your behalf and consents to your
        use of the Service, including any applicable payments.
      </p>
    ),
  },
  {
    id: "account",
    title: "4. Account Registration",
    body: (
      <>
        <p>
          You must provide accurate, current, and complete information when registering and keep it up to date. You are
          responsible for maintaining the confidentiality of your login credentials and for all activity that occurs
          under your account.
        </p>
        <p>
          Notify us immediately at{" "}
          <a className="text-primary hover:underline" href="mailto:support@netset.pro">
            support@netset.pro
          </a>{" "}
          if you suspect any unauthorized access or security breach. We are not liable for any loss resulting from
          unauthorized use of your account.
        </p>
      </>
    ),
  },
  {
    id: "no-guarantee",
    title: "5. No Guarantee of Outcomes",
    body: (
      <>
        <p>
          <strong>Netset does not guarantee that using the Service will result in recruitment offers, responses from
          coaches, athletic scholarships, college admission, or any other particular outcome.</strong>
        </p>
        <p>
          The Service provides tools and AI assistance to help you communicate with coaches; it does not control how
          coaches respond to your outreach, how programs evaluate your profile, or what decisions any college program
          makes. You acknowledge that you may use the Service and receive no response from any coach, and that this
          outcome does not constitute a failure of the Service, a breach of these Terms, or grounds for a refund or
          legal claim against Netset.
        </p>
      </>
    ),
  },
  {
    id: "ai-content",
    title: "6. AI-Generated Content",
    body: (
      <>
        <p>
          The Service uses AI to help you draft outreach emails and receive advisor guidance. AI-generated content is
          produced automatically and may contain errors, inaccuracies, outdated information, or content that does not
          reflect your actual qualifications or situation.
        </p>
        <p>
          <strong>You are solely responsible for reviewing all AI-generated content before sending it to any
          coach.</strong> Sending inaccurate or misleading content is a violation of these Terms and your own
          responsibility. Netset is not liable for any consequences arising from the content of emails you choose to
          send, regardless of whether that content was AI-assisted.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "7. Acceptable Use",
    body: (
      <>
        <p>You agree not to use the Service to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Send spam, bulk unsolicited messages, or harass any person.</li>
          <li>Send emails on behalf of anyone other than yourself.</li>
          <li>Misrepresent your identity, academic record, athletic credentials, or any other information.</li>
          <li>Circumvent rate limits, quotas, plan restrictions, or security measures.</li>
          <li>Reverse-engineer, scrape, decompile, or copy any part of the Service or its underlying data.</li>
          <li>Upload or submit content that is unlawful, defamatory, obscene, or infringes third-party rights.</li>
          <li>Use the Service for any purpose that violates applicable law.</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that violate these rules immediately and without notice
          or refund.
        </p>
      </>
    ),
  },
  {
    id: "billing",
    title: "8. Paid Plans and Billing",
    body: (
      <>
        <p>
          Paid plan fees are charged in advance on a monthly basis via Stripe, Inc. All fees are stated in USD.
          Cancellation takes effect at the end of your current billing period — you retain full access until then.
        </p>
        <p>
          We may change plan pricing on 30 days&apos; notice by email or in-app notification. Continued use of the
          Service after the effective date of a price change constitutes your acceptance of the new pricing.
        </p>
      </>
    ),
  },
  {
    id: "refunds",
    title: "9. No Refunds",
    body: (
      <>
        <p>
          <strong>All fees are non-refundable.</strong> This includes situations where: you do not receive responses
          from coaches; you are dissatisfied with AI-generated content; you stop using the Service mid-billing-period;
          or your account is terminated due to a violation of these Terms.
        </p>
        <p>
          If you believe you were charged in error, contact us at{" "}
          <a className="text-primary hover:underline" href="mailto:billing@netset.pro">
            billing@netset.pro
          </a>{" "}
          within 30 days of the charge. We will investigate in good faith and, if an error occurred, issue a
          correction. If you are in a jurisdiction that mandates a statutory refund right, the minimum statutory right
          applies.
        </p>
      </>
    ),
  },
  {
    id: "email-compliance",
    title: "10. Outreach Emails and CAN-SPAM",
    body: (
      <p>
        You are the sender of record for all outreach emails dispatched through Netset. You are responsible for
        complying with CAN-SPAM, CASL, GDPR, and any other email laws applicable to you. Netset automatically appends
        a compliance footer and opt-out mechanism to every outbound email; you must not remove or alter that footer.
        We reserve the right to halt delivery of any email we determine violates these Terms or our email
        provider&apos;s acceptable-use policies.
      </p>
    ),
  },
  {
    id: "ncaa",
    title: "11. NCAA and Athletic Eligibility Compliance",
    body: (
      <>
        <p>
          You are solely responsible for ensuring that your use of the Service complies with all applicable rules and
          regulations of the NCAA, NAIA, NJCAA, your current educational institution, and any other governing body
          that regulates your athletic eligibility.
        </p>
        <p>
          Netset does not provide NCAA compliance advice. If you are uncertain whether any feature of the Service or
          the content of any communication may affect your eligibility, consult your school&apos;s compliance office
          or a qualified advisor before proceeding.
        </p>
      </>
    ),
  },
  {
    id: "third-parties",
    title: "12. Third-Party Services",
    body: (
      <>
        <p>
          The Service integrates with and relies on third-party providers including Stripe (payments), Resend (email
          delivery), Supabase (database and authentication), and various AI model providers (email generation and
          advisor). Your use of the Service is also subject to the terms and privacy policies of these third parties.
        </p>
        <p>
          We are not responsible for the availability, accuracy, or content of third-party services, and are not
          liable for any loss or damage caused by your reliance on them.
        </p>
      </>
    ),
  },
  {
    id: "your-content",
    title: "13. Your Content",
    body: (
      <p>
        You retain ownership of the profile data and email content you create. You grant us a limited, non-exclusive,
        royalty-free license to use, store, and process your content solely to operate and improve the Service,
        consistent with our{" "}
        <Link className="text-primary hover:underline" href="/privacy">
          Privacy Policy
        </Link>
        . We do not use your content to train AI models without your explicit consent.
      </p>
    ),
  },
  {
    id: "privacy",
    title: "14. Privacy",
    body: (
      <p>
        Your use of the Service is subject to our{" "}
        <Link className="text-primary hover:underline" href="/privacy">
          Privacy Policy
        </Link>
        , which is incorporated into these Terms by reference. By using the Service, you consent to the collection,
        use, and disclosure of your information as described in the Privacy Policy.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "15. Disclaimer of Warranties",
    body: (
      <p className="uppercase">
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
        EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
        PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. NETSET DOES NOT WARRANT THAT THE SERVICE WILL BE
        ERROR-FREE, UNINTERRUPTED, SECURE, OR FREE OF VIRUSES, OR THAT AI-GENERATED OUTPUT WILL BE ACCURATE,
        APPROPRIATE, OR FREE OF INFRINGING CONTENT. NO ORAL OR WRITTEN ADVICE FROM NETSET CREATES ANY WARRANTY
        NOT EXPRESSLY STATED HEREIN.
      </p>
    ),
  },
  {
    id: "liability",
    title: "16. Limitation of Liability",
    body: (
      <>
        <p>
          To the maximum extent permitted by applicable law, Netset&apos;s total cumulative liability to you for any
          claim arising out of or relating to these Terms or your use of the Service shall not exceed the greater of{" "}
          <strong>$100 USD</strong> or the total fees you paid to us in the <strong>three months</strong> immediately
          preceding the event giving rise to the claim. We are not liable under any theory of liability — including
          contract, tort, negligence, strict liability, or otherwise — for any indirect, incidental, special,
          consequential, punitive, or exemplary damages, even if advised of the possibility of such damages.
        </p>
        <p>
          Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities. In those
          jurisdictions, our liability is limited to the maximum extent permitted by law, and the above limitations
          may not apply to you.
        </p>
      </>
    ),
  },
  {
    id: "indemnification",
    title: "17. Indemnification",
    body: (
      <p>
        You agree to defend, indemnify, and hold harmless Netset and its officers, directors, employees, and agents
        from and against any claims, liabilities, damages, judgments, losses, costs, and expenses (including
        reasonable attorneys&apos; fees) arising out of or related to: (a) your use of the Service; (b) your
        violation of these Terms; (c) your violation of any applicable law or regulation; (d) any content you submit
        or send through the Service; or (e) any misrepresentation you make to any coach or institution.
      </p>
    ),
  },
  {
    id: "ip",
    title: "18. Intellectual Property",
    body: (
      <p>
        Netset and its underlying technology, trademarks, and service marks are owned by us or our licensors. These
        Terms do not grant you any right, title, or interest in the Service or our intellectual property other than
        the limited license to use the Service as described herein. All rights not expressly granted are reserved.
      </p>
    ),
  },
  {
    id: "arbitration",
    title: "19. Arbitration Agreement",
    body: (
      <>
        <p>
          <strong>Agreement to Arbitrate.</strong> Except for disputes that qualify for small claims court, you and
          Netset agree that any dispute, claim, or controversy arising out of or relating to these Terms or your use
          of the Service shall be resolved exclusively through binding individual arbitration administered by the
          American Arbitration Association (&quot;AAA&quot;) under its Consumer Arbitration Rules, rather than in a
          court of law.
        </p>
        <p>
          <strong>Class Action Waiver.</strong> You waive any right to bring or participate in a class action, class
          arbitration, or representative proceeding against Netset. All claims must be brought on an individual basis
          only.
        </p>
        <p>
          <strong>Opt-Out.</strong> You may opt out of this arbitration agreement by sending written notice to the
          mailing address in Section 1 within 30 days of first agreeing to these Terms. Your opt-out notice must
          include your name, account email, and a clear statement that you are opting out. Opting out does not affect
          any other provision of these Terms.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "20. Governing Law",
    body: (
      <p>
        These Terms are governed by the laws of the State of California, without regard to conflict-of-law principles.
        For any dispute not subject to arbitration, you consent to exclusive jurisdiction in the courts located in San
        Francisco County, California.
      </p>
    ),
  },
  {
    id: "termination",
    title: "21. Termination",
    body: (
      <>
        <p>
          You may delete your account at any time from Settings. We may suspend or terminate your account immediately,
          without notice or liability, if we determine that you have violated these Terms, engaged in fraudulent or
          abusive behavior, or posed a risk to the security or integrity of the Service.
        </p>
        <p>
          Upon termination, all licenses granted to you under these Terms terminate immediately. Sections 5, 6, 9,
          15–19, and 20 survive termination.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "22. Changes to These Terms",
    body: (
      <p>
        We may update these Terms from time to time. Material changes will be communicated via email or an in-app
        notice at least 14 days before they take effect. Continued use of the Service after that date constitutes your
        acceptance of the updated Terms. The most current version is always available at{" "}
        <Link className="text-primary hover:underline" href="/terms">
          netset.pro/terms
        </Link>
        .
      </p>
    ),
  },
  {
    id: "misc",
    title: "23. Miscellaneous",
    body: (
      <p>
        These Terms, together with our{" "}
        <Link className="text-primary hover:underline" href="/privacy">
          Privacy Policy
        </Link>
        , constitute the entire agreement between you and Netset regarding the Service. If any provision is found
        unenforceable, the remaining provisions continue in full force. Our failure to enforce any right or provision
        does not waive that right. You may not assign your rights or obligations under these Terms without our prior
        written consent.
      </p>
    ),
  },
  {
    id: "contact",
    title: "24. Contact",
    body: (
      <>
        <p>Questions about these Terms? Reach us at:</p>
        <ul className="list-none space-y-1 pl-0">
          <li>
            <strong>Email:</strong>{" "}
            <a className="text-primary hover:underline" href="mailto:legal@netset.pro">
              legal@netset.pro
            </a>
          </li>
          <li>
            <strong>DMCA / copyright complaints:</strong>{" "}
            <a className="text-primary hover:underline" href="mailto:dmca@netset.pro">
              dmca@netset.pro
            </a>
          </li>
          <li>
            <strong>Mailing address:</strong> Netset · 424 Senator Street, Apt 15
          </li>
        </ul>
      </>
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
                <div key={section.id} id={section.id} className="flex flex-col gap-2">
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
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
