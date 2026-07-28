import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamDraftEmail, getDraftSubject } from "@/lib/ai/generate";
import { rateLimit } from "@/lib/rate-limit";
import type { AthleteProfile } from "@/lib/types/profile";
import type { Coach } from "@/lib/types/coach";

const DRAFT_RATE_LIMIT = 30;
const DRAFT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const { coachEmail } = await request.json();

  if (!coachEmail) {
    return NextResponse.json({ error: "Missing coachEmail" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!rateLimit(`ai-draft:${auth.user.id}`, DRAFT_RATE_LIMIT, DRAFT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests — try again in an hour" },
      { status: 429 }
    );
  }

  const [{ data: athlete, error: athleteError }, { data: coach, error: coachError }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", auth.user.id).single<AthleteProfile>(),
      supabase
        .from("coaches_database")
        .select("*")
        .eq("email", coachEmail)
        .single<Coach>(),
    ]);

  if (athleteError || !athlete) {
    return NextResponse.json({ error: "Could not load athlete profile" }, { status: 500 });
  }
  if (coachError || !coach) {
    return NextResponse.json({ error: "Could not load coach" }, { status: 404 });
  }

  const subject = getDraftSubject(athlete, coach);
  const generator = streamDraftEmail(athlete, coach);

  // Pull first chunk before opening the response so a provider failure
  // returns a clean JSON error rather than a truncated 200 stream.
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
        console.error("ai draft stream failed mid-response", err);
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
