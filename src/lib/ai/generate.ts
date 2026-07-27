import { callAIProvider } from "@/lib/ai/provider";
import type { AthleteProfile } from "@/lib/types/profile";
import type { Coach } from "@/lib/types/coach";

export type DraftEmail = { subject: string; body: string };

function buildPrompt(athlete: AthleteProfile, coach: Coach) {
  const system =
    "You are a college tennis recruiting assistant. Write a short, personalized " +
    "introduction email from a student athlete to a college tennis coach. Be " +
    "specific, confident, and concise (120-180 words). Reference the athlete's " +
    "actual stats and the coach's program where relevant. Never invent facts not " +
    'given to you. Respond with ONLY valid JSON: {"subject": "...", "body": "..."}. ' +
    "The body should use \\n\\n for paragraph breaks and end with the athlete's name.";

  const user = `Athlete profile:
- Name: ${athlete.name ?? "Unknown"}
- Grad year: ${athlete.grad_year ?? "N/A"}
- UTR: ${athlete.utr ?? "N/A"}
- WTN: ${athlete.wtn ?? "N/A"}
- GPA: ${athlete.gpa ?? "N/A"}
- National rank: ${athlete.rank ?? "N/A"}
- Singles record: ${athlete.singles_record ?? "N/A"}
- Doubles record: ${athlete.doubles_record ?? "N/A"}
- Playing style: ${athlete.style ?? "N/A"}
- Location: ${athlete.location ?? "N/A"}
- Target division: ${athlete.target_div ?? "N/A"}
- Target region: ${athlete.region ?? "N/A"}
- Video link: ${athlete.video_link ?? "none"}

Coach / program:
- Coach name: ${coach.coach_name}
- School: ${coach.school_name}
- Division: ${coach.division}
- Team UTR: ${coach.team_utr ?? "N/A"}
- Team WTN: ${coach.team_wtn ?? "N/A"}
- Notes: ${coach.notes ?? "none"}`;

  return { system, user };
}

function parseDraft(text: string): DraftEmail {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    if (typeof parsed.subject === "string" && typeof parsed.body === "string") {
      return parsed;
    }
  } catch {
    // fall through to plain-text fallback below
  }
  return { subject: "Introduction from a prospective recruit", body: text.trim() };
}

export async function generateDraftEmail(
  athlete: AthleteProfile,
  coach: Coach
): Promise<DraftEmail> {
  const { system, user } = buildPrompt(athlete, coach);
  const text = await callAIProvider(system, [{ role: "user", content: user }]);
  return parseDraft(text);
}

export async function generateNudgeFollowUp(
  athlete: AthleteProfile,
  coach: Coach,
  context: { originalSubject: string; originalBody: string; daysSinceSent: number }
): Promise<DraftEmail> {
  const system =
    "You are a college tennis recruiting assistant. Write a brief, polite follow-up email from a student athlete to a college tennis coach who hasn't replied to an earlier email. Keep it short (60-100 words), warm, and low-pressure — just a gentle reminder. " +
    'Respond with ONLY valid JSON: {"subject": "...", "body": "..."}. ' +
    "The subject should start with \"Re: \". The body should end with the athlete's name.";

  const user = `Athlete: ${athlete.name ?? "Unknown"}
Original subject: ${context.originalSubject}
Original body:
${context.originalBody}
Days since sent: ${context.daysSinceSent}
Coach: ${coach.coach_name}, ${coach.school_name} (${coach.division})`;

  const text = await callAIProvider(system, [{ role: "user", content: user }]);
  return parseDraft(text);
}

export async function generateFollowUpReply(
  athlete: AthleteProfile,
  coach: Coach,
  context: { originalSubject: string; originalBody: string; coachReplyBody: string }
): Promise<DraftEmail> {
  const system =
    "You are a college tennis recruiting assistant. Write a reply email from a student athlete to a college tennis coach who has responded to their initial outreach. Be enthusiastic, specific to what the coach said, and keep it concise (80-120 words). " +
    'Respond with ONLY valid JSON: {"subject": "...", "body": "..."}. ' +
    "The subject should start with \"Re: \". The body should end with the athlete's name.";

  const user = `Athlete: ${athlete.name ?? "Unknown"}
Original subject: ${context.originalSubject}
Original body:
${context.originalBody}
Coach's reply:
${context.coachReplyBody}
Coach: ${coach.coach_name}, ${coach.school_name} (${coach.division})`;

  const text = await callAIProvider(system, [{ role: "user", content: user }]);
  return parseDraft(text);
}
