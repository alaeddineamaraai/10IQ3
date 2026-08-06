import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("referral_code")
    .eq("id", auth.user.id)
    .single();

  if (profile?.referral_code) {
    return NextResponse.json({ code: profile.referral_code });
  }

  const admin = createSupabaseAdminClient();
  let code = generateCode();
  let attempts = 0;

  while (attempts < 10) {
    const { error } = await admin
      .from("users")
      .update({ referral_code: code })
      .eq("id", auth.user.id);

    if (!error) return NextResponse.json({ code });

    code = generateCode();
    attempts++;
  }

  return NextResponse.json({ error: "Could not generate code" }, { status: 500 });
}
