import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: lists } = await supabase
    .from("coach_lists")
    .select("id, name, created_at, coach_list_members(count)")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  const formatted = (lists ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    created_at: l.created_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    member_count: (l.coach_list_members as any)?.[0]?.count ?? 0,
  }));

  return NextResponse.json({ lists: formatted });
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("coach_lists")
    .insert({ user_id: auth.user.id, name: name.trim() })
    .select("id, name, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ list: { ...data, member_count: 0 } });
}
