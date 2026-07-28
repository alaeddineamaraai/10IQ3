import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OnboardingData } from "@/lib/types/profile";

export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // Delete user data rows first (outreach cascades via FK, users row second).
  // auth.admin.deleteUser removes the auth identity and triggers any DB triggers.
  await admin.from("outreach").delete().eq("user_id", auth.user.id);
  await admin.from("users").delete().eq("id", auth.user.id);

  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body: Partial<OnboardingData> & { profile_complete?: boolean } =
    await request.json();

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("users")
    .update(body)
    .eq("id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
