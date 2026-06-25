import { callAIProvider, type ChatMessage } from "@/lib/ai/provider";
import type { AthleteProfile } from "@/lib/types/profile";

function buildSystemPrompt(athlete: AthleteProfile) {
  return (
    "You are a college tennis recruiting advisor helping a student athlete navigate " +
    "the recruiting process — which divisions/schools fit their level, how to talk to " +
    "coaches, email strategy, timing, and what to do with their UTR/WTN/grades. Be " +
    "direct, encouraging, and specific. Keep replies under 150 words unless asked for " +
    "more detail. Never invent facts about specific schools or coaches you don't know.\n\n" +
    `Athlete profile: grad year ${athlete.grad_year ?? "N/A"}, UTR ${athlete.utr ?? "N/A"}, ` +
    `WTN ${athlete.wtn ?? "N/A"}, GPA ${athlete.gpa ?? "N/A"}, target division ` +
    `${athlete.target_div ?? "N/A"}, target region ${athlete.region ?? "N/A"}, plan ${athlete.plan}.`
  );
}

export async function generateAdvisorReply(
  athlete: AthleteProfile,
  history: ChatMessage[]
): Promise<string> {
  const system = buildSystemPrompt(athlete);
  return callAIProvider(system, history);
}
