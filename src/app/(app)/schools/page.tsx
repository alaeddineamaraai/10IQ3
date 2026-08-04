import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSchoolDetails, getSampleSchoolDetails } from "@/lib/data/schools";
import { getProfile } from "@/lib/data/profile";
import { SchoolsGrid } from "@/components/schools/schools-grid";

async function loadSchools() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { schools: getSampleSchoolDetails(), isSample: true, profileGender: null };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  const [schools, profile] = await Promise.all([
    getSchoolDetails(supabase, userId),
    userId ? getProfile(supabase, userId) : null,
  ]);

  return { schools, isSample: false, profileGender: profile?.gender ?? null };
}

export default async function SchoolsPage() {
  const { schools, isSample, profileGender } = await loadSchools();

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

      <SchoolsGrid schools={schools} profileGender={profileGender} />
    </div>
  );
}
