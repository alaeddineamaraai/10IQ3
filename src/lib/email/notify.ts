import { Resend } from "resend";

const NOTIFY_FROM = process.env.NETSET_NOTIFY_FROM ?? "noreply@netset.pro";
const APP_BASE_URL = process.env.APP_BASE_URL ?? "https://www.netset.pro";

function resend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export async function notifyCoachOpenedEmail({
  athleteEmail,
  athleteName,
  coachEmail,
  coachName,
  outreachId,
}: {
  athleteEmail: string;
  athleteName: string | null | undefined;
  coachEmail: string;
  coachName: string | null | undefined;
  outreachId: string;
}) {
  const client = resend();
  if (!client) return;

  const firstName = athleteName?.split(" ")[0] ?? "there";
  const coachDisplay = coachName ?? coachEmail;

  const text = [
    `Hi ${firstName},`,
    "",
    `${coachDisplay} just opened your email! This is a great sign — coaches who open emails are much more likely to reply.`,
    "",
    "Strike while the iron's hot and send a follow-up if you haven't already.",
    "",
    `View your outreach: ${APP_BASE_URL}/inbox`,
    "",
    "— The Netset team",
  ].join("\n");

  await client.emails.send({
    from: `Netset <${NOTIFY_FROM}>`,
    to: athleteEmail,
    subject: `${coachDisplay} opened your email`,
    text,
    headers: { "X-Entity-Ref-ID": outreachId },
  });
}

export async function notifyPlanLimitReached({
  athleteEmail,
  athleteName,
  emailLimit,
}: {
  athleteEmail: string;
  athleteName: string | null | undefined;
  emailLimit: number;
}) {
  const client = resend();
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
