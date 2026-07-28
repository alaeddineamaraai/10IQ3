import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCoachesPage, getSampleCoaches } from "@/lib/data/coaches";
import { CoachesTable } from "@/components/coaches/coaches-table";

const COACHES_PAGE_SIZE = 50;

async function loadCoaches() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const coaches = getSampleCoaches();
    return { coaches, total: coaches.length, isSample: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    const coaches = getSampleCoaches();
    return { coaches, total: coaches.length, isSample: true };
  }

  const { coaches, total } = await getCoachesPage(supabase, auth.user.id, {
    page: 1,
    pageSize: COACHES_PAGE_SIZE,
    sort: "utr_desc",
  });
  return { coaches, total, isSample: false };
}

export default async function CoachesPage() {
  const { coaches, total, isSample } = await loadCoaches();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Coaches</h1>
        <p className="text-sm text-muted-foreground">
          {isSample
            ? "Sample data — showing a preview of the coaches directory."
            : `${total.toLocaleString()} coaches in the database.`}
        </p>
      </div>

      <CoachesTable initialCoaches={coaches} initialTotal={total} isSample={isSample} />
    </div>
  );
}
