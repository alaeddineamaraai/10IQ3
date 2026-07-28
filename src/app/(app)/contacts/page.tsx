import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSchoolDetails, getSampleSchoolDetails } from "@/lib/data/schools";
import { getCoachesPage, getSampleCoaches } from "@/lib/data/coaches";
import { ContactsClient } from "./contacts-client";

const COACHES_PAGE_SIZE = 50;

async function loadData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const coaches = getSampleCoaches();
    return {
      schools: getSampleSchoolDetails(),
      coaches,
      coachesTotal: coaches.length,
      schoolsSample: true,
      coachesSample: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    const coaches = getSampleCoaches();
    return {
      schools: getSampleSchoolDetails(),
      coaches,
      coachesTotal: coaches.length,
      schoolsSample: true,
      coachesSample: true,
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
    schoolsSample: false,
    coachesSample: false,
  };
}

export default async function ContactsPage() {
  const { schools, coaches, coachesTotal, schoolsSample, coachesSample } = await loadData();

  return (
    <ContactsClient
      schools={schools}
      coaches={coaches}
      coachesTotal={coachesTotal}
      schoolsSample={schoolsSample}
      coachesSample={coachesSample}
    />
  );
}
