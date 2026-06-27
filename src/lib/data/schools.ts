import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchAllCoaches } from "@/lib/data/coaches";
import type { Coach, Outreach } from "@/lib/types/coach";
import type { School, SchoolDetail } from "@/lib/types/school";

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

// Postgres `numeric` columns come back from PostgREST as strings, not
// numbers, even though the Coach type says `number | null`. Coerce here so
// downstream math (average()) and rendering (.toFixed()) don't break.
function normalizeCoach(coach: Coach): Coach {
  return {
    ...coach,
    team_utr: toNumber(coach.team_utr),
    team_wtn: toNumber(coach.team_wtn),
  };
}

function average(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  return nums.reduce((sum, v) => sum + v, 0) / nums.length;
}

function groupSchools(coaches: Coach[]): School[] {
  const bySchool = new Map<string, Coach[]>();
  for (const coach of coaches) {
    const list = bySchool.get(coach.school_name) ?? [];
    list.push(coach);
    bySchool.set(coach.school_name, list);
  }

  return [...bySchool.entries()]
    .map(([school_name, list]) => ({
      school_name,
      division: list[0]?.division ?? "Unknown",
      coach_count: list.length,
      avg_utr: average(list.map((c) => c.team_utr)),
      avg_wtn: average(list.map((c) => c.team_wtn)),
    }))
    .sort((a, b) => a.school_name.localeCompare(b.school_name));
}

function attachOutreach(
  coaches: Coach[],
  outreachByCoach: Map<string, Outreach>
): SchoolDetail["coaches"] {
  return coaches.map((coach) => {
    const outreach = outreachByCoach.get(coach.email);
    return {
      email: coach.email,
      coach_name: coach.coach_name,
      team_utr: coach.team_utr,
      team_wtn: coach.team_wtn,
      notes: coach.notes,
      email_sent: outreach?.email_sent ?? false,
      opened: outreach?.opened ?? false,
      replied: outreach?.replied ?? false,
    };
  });
}

async function fetchOutreachByCoach(
  supabase: SupabaseClient,
  userId: string | null,
  context: string
): Promise<Map<string, Outreach>> {
  if (!userId) return new Map();

  const { data: outreach, error } = await supabase
    .from("outreach")
    .select("*")
    .eq("user_id", userId)
    .returns<Outreach[]>();

  // Degrade gracefully if the `outreach` table/migration isn't in place
  // yet — the roster should still render without per-user send status.
  if (error) {
    console.error(`${context}: outreach query failed`, error);
    return new Map();
  }

  return new Map((outreach ?? []).map((o) => [o.coach_email, o]));
}

export async function getSchools(supabase: SupabaseClient): Promise<School[]> {
  const coaches = await fetchAllCoaches<Coach>(supabase);
  return groupSchools(coaches.map(normalizeCoach));
}

export async function getSchoolDetail(
  supabase: SupabaseClient,
  schoolName: string,
  userId: string | null
): Promise<SchoolDetail | null> {
  const { data: coaches, error: coachesError } = await supabase
    .from("coaches_database")
    .select("*")
    .eq("school_name", schoolName)
    .returns<Coach[]>();

  if (coachesError) throw coachesError;
  if (!coaches || coaches.length === 0) return null;

  const normalizedCoaches = coaches.map(normalizeCoach);
  const outreachByCoach = await fetchOutreachByCoach(supabase, userId, "getSchoolDetail");
  const [summary] = groupSchools(normalizedCoaches);

  return {
    ...summary,
    coaches: attachOutreach(normalizedCoaches, outreachByCoach),
  };
}

/**
 * Full roster + outreach status for every school in one pass, so the
 * Schools tab can show complete detail (stats, UTR chart, roster) inline
 * without a per-school round trip.
 */
export async function getSchoolDetails(
  supabase: SupabaseClient,
  userId: string | null
): Promise<SchoolDetail[]> {
  const coaches = await fetchAllCoaches<Coach>(supabase);
  const normalizedCoaches = coaches.map(normalizeCoach);
  const outreachByCoach = await fetchOutreachByCoach(supabase, userId, "getSchoolDetails");

  const bySchool = new Map<string, Coach[]>();
  for (const coach of normalizedCoaches) {
    const list = bySchool.get(coach.school_name) ?? [];
    list.push(coach);
    bySchool.set(coach.school_name, list);
  }

  return [...bySchool.values()]
    .map((list) => {
      const [summary] = groupSchools(list);
      return { ...summary, coaches: attachOutreach(list, outreachByCoach) };
    })
    .sort((a, b) => a.school_name.localeCompare(b.school_name));
}

const SAMPLE_COACHES: Coach[] = [
  { email: "smitchell@duke.edu", coach_name: "Sarah Mitchell", school_name: "Duke University", division: "D1", team_utr: 13.2, team_wtn: 4.1, notes: "Looking for baseline depth" },
  { email: "jpark@berkeley.edu", coach_name: "James Park", school_name: "UC Berkeley", division: "D1", team_utr: 12.8, team_wtn: 5.0, notes: null },
  { email: "etorres@umich.edu", coach_name: "Elena Torres", school_name: "University of Michigan", division: "D1", team_utr: 12.1, team_wtn: 5.6, notes: "Rebuilding doubles lineup" },
  { email: "rkim@umich.edu", coach_name: "Ryan Kim", school_name: "University of Michigan", division: "D1", team_utr: 11.9, team_wtn: 6.0, notes: null },
  { email: "lchen@williams.edu", coach_name: "Lisa Chen", school_name: "Williams College", division: "D3", team_utr: 10.5, team_wtn: 7.8, notes: "Strong academics fit" },
  { email: "mwhite@williams.edu", coach_name: "Mark White", school_name: "Williams College", division: "D3", team_utr: 10.2, team_wtn: 8.0, notes: null },
  { email: "agarcia@asu.edu", coach_name: "Ana Garcia", school_name: "Arizona State University", division: "D1", team_utr: 12.5, team_wtn: 5.3, notes: null },
  { email: "tnguyen@trincoll.edu", coach_name: "Tom Nguyen", school_name: "Trinity College", division: "D3", team_utr: 9.8, team_wtn: 8.5, notes: "Open roster spots" },
];

export function getSampleSchools(): School[] {
  return groupSchools(SAMPLE_COACHES);
}

export function getSampleSchoolDetails(): SchoolDetail[] {
  const names = [...new Set(SAMPLE_COACHES.map((c) => c.school_name))];
  return names
    .map((name) => getSampleSchoolDetail(name))
    .filter((d): d is SchoolDetail => d != null)
    .sort((a, b) => a.school_name.localeCompare(b.school_name));
}

export function getSampleSchoolDetail(schoolName: string): SchoolDetail | null {
  const coaches = SAMPLE_COACHES.filter((c) => c.school_name === schoolName);
  if (coaches.length === 0) return null;

  const [summary] = groupSchools(coaches);
  return {
    ...summary,
    coaches: coaches.map((coach, i) => ({
      email: coach.email,
      coach_name: coach.coach_name,
      team_utr: coach.team_utr,
      team_wtn: coach.team_wtn,
      notes: coach.notes,
      email_sent: i === 0,
      opened: i === 0,
      replied: false,
    })),
  };
}
