import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateAdvisorReply } from "@/lib/ai/advisor";
import type { AthleteProfile } from "@/lib/types/profile";
import type { ChatMessage } from "@/lib/ai/provider";

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

  const { data: athlete, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", auth.user.id)
    .single<AthleteProfile>();

  if (error || !athlete) {
    return NextResponse.json({ error: "Could not load profile" }, { status: 500 });
  }

  try {
    const reply = await generateAdvisorReply(athlete, messages);
    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI generation failed" },
      { status: 502 }
    );
  }
}
