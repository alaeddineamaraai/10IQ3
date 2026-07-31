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
  const { id, email, marketing_consent } = await request.json();

  if (!id || !email) {
    return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Confirm the id actually belongs to an auth user before writing anything.
  // Without this check, any caller with a known UUID could forge a users row.
  const { data: authUser, error: lookupError } = await supabase.auth.admin.getUserById(id);
  if (lookupError || !authUser?.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("users")
    .upsert(
      {
        id,
        email,
        plan: "free",
        emails_used: 0,
        profile_complete: false,
        marketing_consent: marketing_consent ?? false,
        marketing_consent_at: marketing_consent ? new Date().toISOString() : null,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
