import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function verifyOwner(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, listId: string, userId: string) {
  const { data } = await supabase
    .from("coach_lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!(await verifyOwner(supabase, id, auth.user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: members } = await supabase
    .from("coach_list_members")
    .select("id, coach_email, added_at")
    .eq("list_id", id)
    .order("added_at", { ascending: true });

  // Enrich with coach names from coaches_database
  const emails = (members ?? []).map((m) => m.coach_email);
  const { data: coaches } = emails.length
    ? await supabase
        .from("coaches_database")
        .select("email, coach_name, school_name, division")
        .in("email", emails)
    : { data: [] };

  const coachByEmail = new Map((coaches ?? []).map((c) => [c.email, c]));

  const enriched = (members ?? []).map((m) => ({
    ...m,
    coach_name: coachByEmail.get(m.coach_email)?.coach_name ?? m.coach_email,
    school_name: coachByEmail.get(m.coach_email)?.school_name ?? "—",
    division: coachByEmail.get(m.coach_email)?.division ?? null,
  }));

  return NextResponse.json({ members: enriched });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { coach_email } = await request.json();
  if (!coach_email) return NextResponse.json({ error: "coach_email required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!(await verifyOwner(supabase, id, auth.user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("coach_list_members")
    .upsert({ list_id: id, coach_email }, { onConflict: "list_id,coach_email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { coach_email } = await request.json();
  if (!coach_email) return NextResponse.json({ error: "coach_email required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!(await verifyOwner(supabase, id, auth.user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await supabase
    .from("coach_list_members")
    .delete()
    .eq("list_id", id)
    .eq("coach_email", coach_email);

  return NextResponse.json({ ok: true });
}
