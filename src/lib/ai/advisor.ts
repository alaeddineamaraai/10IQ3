import { callAIProvider, streamAIProvider, type ChatMessage } from "@/lib/ai/provider";
import type { AthleteProfile } from "@/lib/types/profile";
import type { DashboardData } from "@/lib/types/dashboard";

function buildOutreachLine(outreach?: DashboardData) {
  if (!outreach) return "Outreach history: not yet available.";

  const { stats, divisions, regions } = outreach;
  const sentPct = stats.coaches ? ((stats.sent / stats.coaches) * 100).toFixed(1) : "0";
  const replyPct = stats.sent ? ((stats.replied / stats.sent) * 100).toFixed(0) : null;
  const topDivisions = divisions
    .filter((d) => d.sent > 0)
    .slice(0, 3)
    .map((d) => `${d.division} (${d.sent} sent)`)
    .join(", ");
  const topRegions = (regions ?? [])
    .filter((r) => r.sent > 0)
    .slice(0, 3)
    .map((r) => `${r.region} (${r.sent}/${r.total})`)
    .join(", ");

  return (
    `Outreach so far: contacted ${stats.sent} of ${stats.coaches.toLocaleString()} coaches in the ` +
    `database (${sentPct}%). ${stats.opened} opened, ${stats.replied} replied` +
    (replyPct ? ` (${replyPct}% reply rate)` : "") +
    `. ${stats.pending.toLocaleString()} coaches not yet contacted.` +
    (topDivisions ? ` Division mix contacted: ${topDivisions}.` : " No outreach sent yet.") +
    (topRegions ? ` Region coverage: ${topRegions}.` : "")
  );
}

function buildSystemPrompt(athlete: AthleteProfile, outreach?: DashboardData) {
  const facts = [
    athlete.grad_year != null ? `grad year ${athlete.grad_year}` : null,
    athlete.gender ? `gender ${athlete.gender}` : null,
    athlete.utr != null ? `UTR ${athlete.utr}` : null,
    athlete.wtn != null ? `WTN ${athlete.wtn}` : null,
    athlete.gpa != null ? `GPA ${athlete.gpa}` : null,
    athlete.rank != null ? `national ranking #${athlete.rank}` : null,
    athlete.singles_record ? `singles record ${athlete.singles_record}` : null,
    athlete.doubles_record ? `doubles record ${athlete.doubles_record}` : null,
    athlete.style ? `play style: ${athlete.style}` : null,
    athlete.target_div ? `target division ${athlete.target_div}` : null,
    athlete.region ? `target region ${athlete.region}` : null,
    athlete.location ? `current location ${athlete.location}` : null,
    athlete.school ? `current school ${athlete.school}` : null,
    athlete.academy ? `academy ${athlete.academy}` : null,
    `plan ${athlete.plan}`,
  ]
    .filter((f): f is string => f !== null)
    .join(", ");

  const profileLine = `Athlete profile: ${facts}.`;

  return (
    "You are a college tennis recruiting advisor helping a student athlete navigate " +
    "the recruiting process — which divisions/schools fit their level, how to talk to " +
    "coaches, email strategy, timing, and what to do with their UTR/WTN/grades. Be " +
    "direct, encouraging, and specific. Keep replies under 150 words unless asked for " +
    "more detail. Never invent facts about specific schools or coaches you don't know, " +
    "and never mention a profile field that wasn't given to you above (don't say " +
    '"N/A" or "not provided" — just skip topics you have no data for). Format your ' +
    "replies to be easy to scan: use **bold** for key terms or numbers, short " +
    "paragraphs, and numbered or bulleted markdown lists (\"1. \" or \"- \") when " +
    "giving multiple steps or options — never one dense paragraph. Use the athlete's " +
    "real outreach numbers below when they're relevant — for example, point out if " +
    "they've only contacted a handful of coaches and could scale up, flag a low reply " +
    "rate and suggest what to change, or note if their outreach skews toward one " +
    "division more than their stated target.\n\n" +
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
  return callAIProvider(system, history, athlete.plan);
}

export function streamAdvisorReply(
  athlete: AthleteProfile,
  history: ChatMessage[],
  outreach?: DashboardData,
): AsyncGenerator<string> {
  const system = buildSystemPrompt(athlete, outreach);
  return streamAIProvider(system, history, athlete.plan);
}
