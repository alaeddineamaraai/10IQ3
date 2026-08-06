import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ListDetailClient } from "./list-detail-client";

async function loadList(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: list } = await supabase
    .from("coach_lists")
    .select("id, name, created_at")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();

  if (!list) return null;

  const { data: members } = await supabase
    .from("coach_list_members")
    .select("id, coach_email, added_at")
    .eq("list_id", id)
    .order("added_at", { ascending: true });

  const emails = (members ?? []).map((m) => m.coach_email);
  const { data: coaches } = emails.length
    ? await supabase
        .from("coaches_database")
        .select("email, coach_name, school_name, division")
        .in("email", emails)
    : { data: [] };

  const coachByEmail = new Map((coaches ?? []).map((c) => [c.email, c]));

  const enriched = (members ?? []).map((m) => ({
    id: m.id,
    coach_email: m.coach_email,
    added_at: m.added_at,
    coach_name: coachByEmail.get(m.coach_email)?.coach_name ?? m.coach_email,
    school_name: coachByEmail.get(m.coach_email)?.school_name ?? "—",
    division: coachByEmail.get(m.coach_email)?.division ?? null,
  }));

  return { list, members: enriched };
}

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadList(id);
  if (!data) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <ListDetailClient list={data.list} initialMembers={data.members} />
    </div>
  );
}
