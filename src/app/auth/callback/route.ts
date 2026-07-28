import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const oauthError = searchParams.get("error");

  // Supabase forwards OAuth provider errors here with ?error=... instead of a code.
  if (oauthError || !code) {
    const desc = searchParams.get("error_description");
    const msg = desc
      ? decodeURIComponent(desc.replace(/\+/g, " "))
      : "Sign-in failed. Please try again.";
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth?error=oauth_failed`);
  }

  // Password reset — session is valid but user needs to set a new password.
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  // Upsert the users row — new OAuth users won't have one yet.
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("users")
    .select("profile_complete")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await admin.from("users").upsert(
      {
        id: data.user.id,
        email: data.user.email,
        plan: "free",
        emails_used: 0,
        profile_complete: false,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (insertError) {
      console.error("users row creation failed for", data.user.id, insertError);
    }
  }

  const destination = existing?.profile_complete ? "/dashboard" : "/onboarding";
  return NextResponse.redirect(`${origin}${destination}`);
}
