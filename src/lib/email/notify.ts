import { Resend } from "resend";

const NOTIFY_FROM = process.env.NETSET_NOTIFY_FROM ?? "noreply@netset.pro";
const APP_BASE_URL = process.env.APP_BASE_URL ?? "https://www.netset.pro";

function resendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

// ─── Coach opened email ────────────────────────────────────────────────────

export async function notifyCoachOpenedEmail({
  athleteEmail,
  athleteName,
  coachEmail,
  coachName,
  outreachId,
  emailsLeft,
  plan,
}: {
  athleteEmail: string;
  athleteName: string | null | undefined;
  coachEmail: string;
  coachName: string | null | undefined;
  outreachId: string;
  emailsLeft?: number;
  plan?: string;
}) {
  const client = resendClient();
  if (!client) return;

  const firstName = athleteName?.split(" ")[0] ?? "there";
  const coachDisplay = coachName ?? coachEmail;
  const isLow = plan === "free" && emailsLeft != null && emailsLeft <= 2;

  const lines = [
    `Hi ${firstName},`,
    "",
    `${coachDisplay} just opened your email! Coaches who open are much more likely to reply — this is a great sign.`,
    "",
    "Strike while it's fresh and send a follow-up if you haven't already.",
    "",
    ...(isLow && emailsLeft === 0
      ? [
          `You've used all your free emails. Upgrade to Pro to keep your momentum going.`,
          "",
          `Upgrade now: ${APP_BASE_URL}/paywall`,
        ]
      : isLow
      ? [
          `You have ${emailsLeft} free email${emailsLeft === 1 ? "" : "s"} left. Upgrade before you run out so you never miss a reply window.`,
          "",
          `Upgrade now: ${APP_BASE_URL}/paywall`,
        ]
      : [`View your outreach: ${APP_BASE_URL}/inbox`]),
    "",
    "— The Netset team",
  ];

  await client.emails.send({
    from: `Netset <${NOTIFY_FROM}>`,
    to: athleteEmail,
    subject: `${coachDisplay} opened your email`,
    text: lines.join("\n"),
    headers: { "X-Entity-Ref-ID": outreachId },
  });
}

// ─── Plan limit reached ────────────────────────────────────────────────────

export async function notifyPlanLimitReached({
  athleteEmail,
  athleteName,
  emailLimit,
}: {
  athleteEmail: string;
  athleteName: string | null | undefined;
  emailLimit: number;
}) {
  const client = resendClient();
  if (!client) return;

  const firstName = athleteName?.split(" ")[0] ?? "there";

  const text = [
    `Hi ${firstName},`,
    "",
    `You've sent all ${emailLimit} of your free recruiting emails on Netset.`,
    "",
    "Don't let momentum stop here — coaches are still out there looking for players like you. Upgrade to Pro and keep your recruiting going.",
    "",
    `Upgrade now: ${APP_BASE_URL}/paywall`,
    "",
    "— The Netset team",
  ].join("\n");

  await client.emails.send({
    from: `Netset <${NOTIFY_FROM}>`,
    to: athleteEmail,
    subject: "You've used all your free emails — upgrade to keep recruiting",
    text,
  });
}

// ─── Onboarding sequence ───────────────────────────────────────────────────

const ONBOARDING_EMAILS: Record<
  1 | 2 | 3,
  { subject: string; body: (firstName: string) => string }
> = {
  1: {
    subject: "Your first step to college tennis recruiting",
    body: (firstName) =>
      [
        `Hi ${firstName},`,
        "",
        "Welcome to Netset — I'm glad you're here.",
        "",
        "Most athletes spend months emailing coaches one by one from Gmail. Netset does the heavy lifting: it reads each school's profile, drafts a personalized email in your voice, and tracks every open and reply.",
        "",
        "Three things to do right now:",
        "  1. Finish your profile (WTN, grad year, target division)",
        "  2. Browse the school database and save your targets",
        "  3. Send your first email — it takes under 2 minutes",
        "",
        `Get started: ${APP_BASE_URL}/dashboard`,
        "",
        "— The Netset team",
      ].join("\n"),
  },
  2: {
    subject: "The one thing coaches actually look for in cold emails",
    body: (firstName) =>
      [
        `Hi ${firstName},`,
        "",
        "Most recruiting emails coaches receive are identical. \"I'm a 2027 recruit with a 4.0 GPA and a passion for tennis.\" Every one sounds the same.",
        "",
        "The emails that get replies mention something specific — a recent team result, a coach's known system, what drew them to that particular school.",
        "",
        "Netset pulls each school's conference, facilities, campus setting, and climate, then uses that to write something a coach can actually feel was written for them.",
        "",
        `Try it on your next email: ${APP_BASE_URL}/compose`,
        "",
        "— The Netset team",
      ].join("\n"),
  },
  3: {
    subject: "Where are you in your recruiting journey?",
    body: (firstName) =>
      [
        `Hi ${firstName},`,
        "",
        "A week in — how's it going?",
        "",
        "Athletes who contact 15+ coaches in their first month are 3× more likely to receive a serious inquiry. The window closes faster than it feels like it will.",
        "",
        "If you've been hesitating, the best move is to just send the first one. The AI handles the hard part.",
        "",
        `Send now: ${APP_BASE_URL}/compose`,
        "",
        "— The Netset team",
      ].join("\n"),
  },
};

export async function sendOnboardingEmail({
  athleteEmail,
  athleteName,
  step,
}: {
  athleteEmail: string;
  athleteName: string | null | undefined;
  step: 1 | 2 | 3;
}) {
  const client = resendClient();
  if (!client) return;

  const firstName = athleteName?.split(" ")[0] ?? "there";
  const { subject, body } = ONBOARDING_EMAILS[step];

  await client.emails.send({
    from: `Netset <${NOTIFY_FROM}>`,
    to: athleteEmail,
    subject,
    text: body(firstName),
  });
}

// ─── Weekly digest ─────────────────────────────────────────────────────────

export async function sendWeeklyDigest({
  athleteEmail,
  athleteName,
  weekSent,
  weekOpened,
  weekReplied,
  totalSent,
  totalCoaches,
  hotCoach,
}: {
  athleteEmail: string;
  athleteName: string | null | undefined;
  weekSent: number;
  weekOpened: number;
  weekReplied: number;
  totalSent: number;
  totalCoaches: number;
  hotCoach?: string | null;
}) {
  const client = resendClient();
  if (!client) return;

  const firstName = athleteName?.split(" ")[0] ?? "there";
  const openRate = weekSent > 0 ? Math.round((weekOpened / weekSent) * 100) : 0;
  const pct = totalCoaches > 0 ? ((totalSent / totalCoaches) * 100).toFixed(1) : "0.0";

  const lines = [
    `Hi ${firstName},`,
    "",
    "Here's your recruiting update from the past week:",
    "",
    `  • Emails sent:   ${weekSent}`,
    `  • Coaches opened: ${weekOpened}${weekSent > 0 ? ` (${openRate}%)` : ""}`,
    `  • Replies:        ${weekReplied}`,
    "",
    `All time: you've reached ${totalSent} of ${totalCoaches.toLocaleString()} coaches (${pct}%).`,
    "",
  ];

  if (hotCoach) {
    lines.push(`${hotCoach} recently opened your email — a follow-up now could make the difference.`, "");
  }

  if (totalSent < 15) {
    lines.push(
      `Tip: athletes who contact 15+ coaches get 3× more replies. You're at ${totalSent} — keep going.`,
      ""
    );
  }

  lines.push(`Go to your dashboard: ${APP_BASE_URL}/dashboard`, "", "— The Netset team");

  await client.emails.send({
    from: `Netset <${NOTIFY_FROM}>`,
    to: athleteEmail,
    subject:
      weekReplied > 0
        ? `You got ${weekReplied} repl${weekReplied === 1 ? "y" : "ies"} this week 🎾`
        : weekOpened > 0
        ? `${weekOpened} coach${weekOpened === 1 ? "" : "es"} opened your email this week`
        : "Your weekly recruiting update",
    text: lines.join("\n"),
  });
}
