import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Verifies the access_token pulled from a Supabase email-confirmation
 * redirect hash (#access_token=...&type=signup) and ensures a users row
 * exists as a safety net, in case signup-profile failed or this is an
 * older row created before that insert existed.
 */
export async function POST(request: Request) {
  const { access_token } = await request.json();

  if (!access_token) {
    return NextResponse.json({ error: "Missing access_token" }, { status: 400 });
  }

  const userRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  });

  if (!userRes.ok) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const authUser = await userRes.json();
  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("users")
    .select("profile_complete")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("users").insert({
      id: authUser.id,
      email: authUser.email,
      plan: "free",
      emails_used: 0,
      profile_complete: false,
    });
  }

  return NextResponse.json({
    email: authUser.email,
    profile_complete: existing?.profile_complete ?? false,
  });
}
