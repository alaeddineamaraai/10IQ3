import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamFollowUpReply, getReplySubject } from "@/lib/ai/generate";
import { rateLimit } from "@/lib/rate-limit";
import type { AthleteProfile } from "@/lib/types/profile";
import type { Coach, Outreach, OutreachReply } from "@/lib/types/coach";

const FOLLOWUP_RATE_LIMIT = 30;
const FOLLOWUP_WINDOW_MS = 60 * 60 * 1000;

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

  if (!rateLimit(`ai-followup:${auth.user.id}`, FOLLOWUP_RATE_LIMIT, FOLLOWUP_WINDOW_MS)) {
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

  const [{ data: athlete, error: athleteError }, { data: coach, error: coachError }, { data: replies }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", auth.user.id).single<AthleteProfile>(),
      supabase
        .from("coaches_database")
        .select("*")
        .eq("email", outreach.coach_email)
        .single<Coach>(),
      supabase
        .from("outreach_replies")
        .select("*")
        .eq("outreach_id", outreachId)
        .order("received_at", { ascending: false })
        .limit(1)
        .returns<OutreachReply[]>(),
    ]);

  if (athleteError || !athlete) {
    return NextResponse.json({ error: "Could not load athlete profile" }, { status: 500 });
  }
  if (coachError || !coach) {
    return NextResponse.json({ error: "Could not load coach" }, { status: 404 });
  }

  const latestReply = replies?.[0];
  if (!latestReply) {
    return NextResponse.json({ error: "No reply to respond to yet" }, { status: 400 });
  }

  const subject = getReplySubject(outreach.subject ?? "");
  const generator = streamFollowUpReply(athlete, coach, {
    originalSubject: outreach.subject ?? "",
    originalBody: outreach.body ?? "",
    coachReplyBody: latestReply.body ?? "",
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
        console.error("ai followup stream failed mid-response", err);
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
      "X-Draft-Subject": encodeURIComponent(subject),
    },
  });
}
