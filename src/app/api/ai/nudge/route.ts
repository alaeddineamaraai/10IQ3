import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamNudgeFollowUp, getReplySubject } from "@/lib/ai/generate";
import { rateLimit } from "@/lib/rate-limit";
import type { AthleteProfile } from "@/lib/types/profile";
import type { Coach, Outreach } from "@/lib/types/coach";

const DAY_MS = 24 * 60 * 60 * 1000;
const NUDGE_RATE_LIMIT = 30;
const NUDGE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const { outreachId } = await request.json();

  if (!outreachId) {
    return NextResponse.json({ error: "Missing outreachId" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!rateLimit(`ai-nudge:${auth.user.id}`, NUDGE_RATE_LIMIT, NUDGE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests — try again in an hour" },
      { status: 429 }
    );
  }

  const { data: outreach, error: outreachError } = await supabase
    .from("outreach")
    .select("*")
    .eq("id", outreachId)
    .eq("user_id", auth.user.id)
    .single<Outreach>();

  if (outreachError || !outreach) {
    return NextResponse.json({ error: "Outreach thread not found" }, { status: 404 });
  }

  const [{ data: athlete, error: athleteError }, { data: coach, error: coachError }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", auth.user.id).single<AthleteProfile>(),
      supabase
        .from("coaches_database")
        .select("*")
        .eq("email", outreach.coach_email)
        .single<Coach>(),
    ]);

  if (athleteError || !athlete) {
    return NextResponse.json({ error: "Could not load athlete profile" }, { status: 500 });
  }
  if (coachError || !coach) {
    return NextResponse.json({ error: "Could not load coach" }, { status: 404 });
  }

  const sentAt = outreach.sent_at ?? outreach.created_at;
  const daysSinceSent = Math.floor((Date.now() - new Date(sentAt).getTime()) / DAY_MS);
  const subject = getReplySubject(outreach.subject ?? "");

  const generator = streamNudgeFollowUp(athlete, coach, {
    originalSubject: outreach.subject ?? "",
    originalBody: outreach.body ?? "",
    daysSinceSent,
  });

  let first: IteratorResult<string>;
  try {
    first = await generator.next();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI generation failed" },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done && first.value) {
          controller.enqueue(encoder.encode(first.value));
        }
        for await (const chunk of generator) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        console.error("ai nudge stream failed mid-response", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
      "X-Accel-Buffering": "no",
      "X-Draft-Subject": encodeURIComponent(subject),
    },
  });
}
