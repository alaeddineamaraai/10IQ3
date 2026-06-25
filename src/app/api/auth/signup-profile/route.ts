import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Called immediately after supabase.auth.signUp() resolves, regardless of
 * whether a session/access_token came back. The old vanilla-JS app checked
 * `if (!access_token) throw "check your inbox"` BEFORE inserting the users
 * row, so confirmation-required signups (the normal case) never got a row
 * at all because the function threw and exited first. This route is called
 * unconditionally before that check, so the row always exists.
 */
export async function POST(request: Request) {
  const { id, email } = await request.json();

  if (!id || !email) {
    return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("users")
    .upsert(
      {
        id,
        email,
        plan: "free",
        emails_used: 0,
        profile_complete: false,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
