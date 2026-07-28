import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Marks one (or all) reply notifications as viewed. The RLS update policy
 * on `outreach` already scopes writes to the owning user, so this uses the
 * session-bound client rather than the admin client — no extra ownership
 * check needed here.
 */
export async function POST(request: Request) {
  const { id, markAll } = (await request.json()) as { id?: string; markAll?: boolean };

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const now = new Date().toISOString();

  if (markAll) {
    const { error } = await supabase
      .from("outreach")
      .update({ reply_viewed_at: now })
      .eq("user_id", auth.user.id)
      .eq("replied", true)
      .is("reply_viewed_at", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("outreach")
    .update({ reply_viewed_at: now })
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .is("reply_viewed_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
