import { callAIProvider, type ChatMessage } from "@/lib/ai/provider";
import type { AthleteProfile } from "@/lib/types/profile";
import type { DashboardData } from "@/lib/types/dashboard";

function buildOutreachLine(outreach?: DashboardData) {
  if (!outreach) return "Outreach history: not yet available.";

  const { stats, divisions } = outreach;
  const sentPct = stats.coaches ? ((stats.sent / stats.coaches) * 100).toFixed(1) : "0";
  const replyPct = stats.sent ? ((stats.replied / stats.sent) * 100).toFixed(0) : null;
  const topDivisions = divisions
    .slice(0, 3)
    .map((d) => `${d.division} (${d.sent} sent)`)
    .join(", ");

  return (
    `Outreach so far: contacted ${stats.sent} of ${stats.coaches.toLocaleString()} coaches in the ` +
    `database (${sentPct}%). ${stats.opened} opened, ${stats.replied} replied` +
    (replyPct ? ` (${replyPct}% reply rate)` : "") +
    `. ${stats.pending.toLocaleString()} coaches not yet contacted.` +
    (topDivisions
      ? ` Outreach so far is concentrated in: ${topDivisions}.`
      : " No outreach sent yet.")
  );
}

function buildSystemPrompt(athlete: AthleteProfile, outreach?: DashboardData) {
  const profileLine =
    `Athlete profile: grad year ${athlete.grad_year ?? "N/A"}, UTR ${athlete.utr ?? "N/A"}, ` +
    `WTN ${athlete.wtn ?? "N/A"}, GPA ${athlete.gpa ?? "N/A"}, target division ` +
    `${athlete.target_div ?? "N/A"}, target region ${athlete.region ?? "N/A"}, plan ${athlete.plan}.`;

  return (
    "You are a college tennis recruiting advisor helping a student athlete navigate " +
    "the recruiting process — which divisions/schools fit their level, how to talk to " +
    "coaches, email strategy, timing, and what to do with their UTR/WTN/grades. Be " +
    "direct, encouraging, and specific. Keep replies under 150 words unless asked for " +
    "more detail. Never invent facts about specific schools or coaches you don't know. " +
    "Use the athlete's real outreach numbers below when they're relevant — for example, " +
    "point out if they've only contacted a handful of coaches and could scale up, flag a " +
    "low reply rate and suggest what to change, or note if their outreach skews toward " +
    "one division more than their stated target.\n\n" +
    profileLine +
    "\n" +
    buildOutreachLine(outreach)
  );
}

export async function generateAdvisorReply(
  athlete: AthleteProfile,
  history: ChatMessage[],
  outreach?: DashboardData,
): Promise<string> {
  const system = buildSystemPrompt(athlete, outreach);
  return callAIProvider(system, history);
}
