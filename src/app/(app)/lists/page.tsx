import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ListsClient } from "./lists-client";

async function loadLists() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data } = await supabase
    .from("coach_lists")
    .select("id, name, created_at, coach_list_members(count)")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    created_at: l.created_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    member_count: (l.coach_list_members as any)?.[0]?.count ?? 0,
  }));
}

export default async function ListsPage() {
  const lists = await loadLists();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lists</h1>
        <p className="text-sm text-muted-foreground">
          Organise coaches into named lists and compose to a whole list at once.
        </p>
      </div>
      <ListsClient initialLists={lists} />
    </div>
  );
}
