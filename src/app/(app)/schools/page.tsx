import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSchools, getSampleSchools } from "@/lib/data/schools";
import { SchoolsGrid } from "@/components/schools/schools-grid";

async function loadSchools() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { schools: getSampleSchools(), isSample: true };
  }

  const supabase = await createSupabaseServerClient();
  return { schools: await getSchools(supabase), isSample: false };
}

export default async function SchoolsPage() {
  const { schools, isSample } = await loadSchools();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schools</h1>
        <p className="text-sm text-muted-foreground">
          {isSample
            ? "Sample data — showing a preview of the schools directory."
            : `${schools.length} schools with coaches in the database.`}
        </p>
      </div>

      <SchoolsGrid schools={schools} />
    </div>
  );
}
