import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSchoolDetails } from "@/lib/data/schools";
import { getProfile } from "@/lib/data/profile";
import { SchoolsGrid } from "@/components/schools/schools-grid";

async function loadSchools() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  if (!userId) {
    const admin = createSupabaseAdminClient();
    const schools = await getSchoolDetails(admin, null);
    return { schools, profileGender: null };
  }

  const [schools, profile] = await Promise.all([
    getSchoolDetails(supabase, userId),
    getProfile(supabase, userId),
  ]);

  return { schools, profileGender: profile?.gender ?? null };
}

export default async function SchoolsPage() {
  const { schools, profileGender } = await loadSchools();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schools</h1>
        <p className="text-sm text-muted-foreground">
          {schools.length} schools with coaches in the database.
        </p>
      </div>

      <Suspense>
        <SchoolsGrid schools={schools} profileGender={profileGender} />
      </Suspense>
    </div>
  );
}
