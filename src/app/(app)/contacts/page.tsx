import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSchoolDetails } from "@/lib/data/schools";
import { getCoachesPage } from "@/lib/data/coaches";
import { ContactsClient } from "./contacts-client";

const COACHES_PAGE_SIZE = 50;

async function loadData() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    // Demo: real data from DB, no outreach overlay
    const admin = createSupabaseAdminClient();
    const [schools, coachesPage] = await Promise.all([
      getSchoolDetails(admin, null),
      getCoachesPage(admin, null, { page: 1, pageSize: COACHES_PAGE_SIZE, sort: "utr_desc" }),
    ]);
    return {
      schools,
      coaches: coachesPage.coaches,
      coachesTotal: coachesPage.total,
    };
  }

  // Schools still aggregates the full coach list (grouping by school is a
  // different query shape entirely — see getSchoolDetails). Coaches, the
  // large/growing raw list, only fetches its first page here; the table
  // fetches subsequent pages/filters itself via /api/coaches.
  const [schools, coachesPage] = await Promise.all([
    getSchoolDetails(supabase, auth.user.id),
    getCoachesPage(supabase, auth.user.id, { page: 1, pageSize: COACHES_PAGE_SIZE, sort: "utr_desc" }),
  ]);

  return {
    schools,
    coaches: coachesPage.coaches,
    coachesTotal: coachesPage.total,
  };
}

export default async function ContactsPage() {
  const { schools, coaches, coachesTotal } = await loadData();

  return (
    <ContactsClient
      schools={schools}
      coaches={coaches}
      coachesTotal={coachesTotal}
    />
  );
}
