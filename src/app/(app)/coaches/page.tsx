import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCoachesWithOutreach, getSampleCoaches } from "@/lib/data/coaches";
import { CoachesTable } from "@/components/coaches/coaches-table";

async function loadCoaches() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { coaches: getSampleCoaches(), isSample: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return { coaches: getSampleCoaches(), isSample: true };
  }

  return { coaches: await getCoachesWithOutreach(supabase, auth.user.id), isSample: false };
}

export default async function CoachesPage() {
  const { coaches, isSample } = await loadCoaches();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Coaches</h1>
        <p className="text-sm text-muted-foreground">
          {isSample
            ? "Sample data — showing a preview of the coaches directory."
            : `${coaches.length.toLocaleString()} coaches in the database.`}
        </p>
      </div>

      <CoachesTable coaches={coaches} />
    </div>
  );
}
