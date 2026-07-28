import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamAdvisorReply } from "@/lib/ai/advisor";
import { getDashboardData } from "@/lib/data/dashboard";
import { rateLimit } from "@/lib/rate-limit";
import type { AthleteProfile } from "@/lib/types/profile";
import type { ChatMessage } from "@/lib/ai/provider";

// 60 advisor messages per user per hour
const ADVISOR_RATE_LIMIT = 60;
const ADVISOR_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages: ChatMessage[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!rateLimit(`advisor:${auth.user.id}`, ADVISOR_RATE_LIMIT, ADVISOR_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests — try again in an hour" },
      { status: 429 }
    );
  }

  const [{ data: athlete, error }, outreach] = await Promise.all([
    supabase.from("users").select("*").eq("id", auth.user.id).single<AthleteProfile>(),
    getDashboardData(supabase, auth.user.id).catch(() => undefined),
  ]);

  if (error || !athlete) {
    return NextResponse.json({ error: "Could not load profile" }, { status: 500 });
  }

  const generator = streamAdvisorReply(athlete, messages, outreach);

  // Pull the first chunk before opening the response stream: if the
  // provider fails immediately (bad key, 4xx/5xx), this throws while we can
  // still return a clean JSON error — matching the non-streaming route's
  // error contract instead of silently truncating a "200 OK" stream.
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
        // The provider dropped mid-stream — end the stream rather than
        // hang; the client already has a partial reply, which the UI marks
        // by simply stopping the "thinking" indicator, not with a hard error.
        console.error("advisor chat stream failed mid-response", err);
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
    },
  });
}
