import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateDraftEmail } from "@/lib/ai/generate";
import type { AthleteProfile } from "@/lib/types/profile";
import type { Coach } from "@/lib/types/coach";

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

  try {
    const draft = await generateDraftEmail(athlete, coach);
    return NextResponse.json(draft);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI generation failed" },
      { status: 502 }
    );
  }
}
