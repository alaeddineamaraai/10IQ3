import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchAllCoaches } from "@/lib/data/coaches";
import type { Coach, Outreach } from "@/lib/types/coach";
import type { School, SchoolCoach, SchoolDetail, SchoolInfo } from "@/lib/types/school";

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toBoolean(value: unknown): boolean | null {
  if (value == null) return null;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return null;
}

// Postgres `numeric` columns come back from PostgREST as strings, not
// numbers, even though the Coach type says `number | null`. Coerce here so
// downstream math (average()) and rendering (.toFixed()) don't break.
function normalizeCoach(coach: Coach): Coach {
  return {
    ...coach,
    team_utr: toNumber(coach.team_utr),
    team_wtn: toNumber(coach.team_wtn),
    ita_team_ranking: toNumber(coach.ita_team_ranking),
    roster_size: toNumber(coach.roster_size),
    indoor_courts: toNumber(coach.indoor_courts),
    outdoor_courts: toNumber(coach.outdoor_courts),
    tuition_in_state: toNumber(coach.tuition_in_state),
    tuition_out_of_state: toNumber(coach.tuition_out_of_state),
    room_and_board: toNumber(coach.room_and_board),
    total_annual_cost: toNumber(coach.total_annual_cost),
    acceptance_rate: toNumber(coach.acceptance_rate),
    student_population: toNumber(coach.student_population),
    avg_sat_score: toNumber(coach.avg_sat_score),
    distance_to_airport_miles: toNumber(coach.distance_to_airport_miles),
    avg_temp_jan_f: toNumber(coach.avg_temp_jan_f),
    avg_temp_july_f: toNumber(coach.avg_temp_july_f),
    scholarships_offered: toBoolean(coach.scholarships_offered),
    housing_on_campus: toBoolean(coach.housing_on_campus),
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

function extractSchoolInfo(coach: Coach): SchoolInfo {
  return {
    city: coach.city,
    state: coach.state,
    region: coach.region,
    website: coach.website,
    tuition_in_state: coach.tuition_in_state,
    tuition_out_of_state: coach.tuition_out_of_state,
    room_and_board: coach.room_and_board,
    total_annual_cost: coach.total_annual_cost,
    acceptance_rate: coach.acceptance_rate,
    student_population: coach.student_population,
    avg_sat_score: coach.avg_sat_score,
    degrees_offered: coach.degrees_offered,
    housing_on_campus: coach.housing_on_campus,
    setting: coach.setting,
    nearest_airport: coach.nearest_airport,
    distance_to_airport_miles: coach.distance_to_airport_miles,
    avg_temp_jan_f: coach.avg_temp_jan_f,
    avg_temp_july_f: coach.avg_temp_july_f,
    climate_description: coach.climate_description,
    campus_description: coach.campus_description,
  };
}

function attachOutreach(
  coaches: Coach[],
  outreachByCoach: Map<string, Outreach>
): SchoolCoach[] {
  return coaches.map((coach) => {
    const outreach = outreachByCoach.get(coach.email);
    return {
      email: coach.email,
      coach_name: coach.coach_name,
      gender: coach.gender,
      head_coach_name: coach.head_coach_name,
      assistant_coaches: coach.assistant_coaches,
      team_utr: coach.team_utr,
      team_wtn: coach.team_wtn,
      ita_team_ranking: coach.ita_team_ranking,
      conference: coach.conference,
      roster_size: coach.roster_size,
      indoor_courts: coach.indoor_courts,
      outdoor_courts: coach.outdoor_courts,
      scholarships_offered: coach.scholarships_offered,
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
  const info = extractSchoolInfo(normalizedCoaches[0]!);

  return {
    ...summary,
    info,
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
      const info = extractSchoolInfo(list[0]!);
      return { ...summary, info, coaches: attachOutreach(list, outreachByCoach) };
    })
    .sort((a, b) => a.school_name.localeCompare(b.school_name));
}

const NULL_SCHOOL_INFO: SchoolInfo = {
  city: null,
  state: null,
  region: null,
  website: null,
  tuition_in_state: null,
  tuition_out_of_state: null,
  room_and_board: null,
  total_annual_cost: null,
  acceptance_rate: null,
  student_population: null,
  avg_sat_score: null,
  degrees_offered: null,
  housing_on_campus: null,
  setting: null,
  nearest_airport: null,
  distance_to_airport_miles: null,
  avg_temp_jan_f: null,
  avg_temp_july_f: null,
  climate_description: null,
  campus_description: null,
};

const SAMPLE_COACHES: Coach[] = [
  {
    email: "smitchell@duke.edu",
    coach_name: "Sarah Mitchell",
    school_name: "Duke University",
    division: "D1",
    gender: "Women",
    head_coach_name: "Sarah Mitchell",
    assistant_coaches: "Amy Lee",
    team_utr: 13.2,
    team_wtn: 4.1,
    ita_team_ranking: 8,
    region: "South",
    conference: "ACC",
    roster_size: 10,
    indoor_courts: 6,
    outdoor_courts: 8,
    scholarships_offered: true,
    city: "Durham",
    state: "NC",
    website: "https://goduke.com",
    tuition_in_state: 63450,
    tuition_out_of_state: 63450,
    room_and_board: 17500,
    total_annual_cost: 80950,
    acceptance_rate: 6,
    student_population: 17000,
    avg_sat_score: 1510,
    degrees_offered: "Arts & Sciences, Engineering, Pratt, Fuqua, Sanford",
    housing_on_campus: true,
    setting: "Suburban",
    nearest_airport: "Raleigh-Durham International (RDU)",
    distance_to_airport_miles: 18,
    avg_temp_jan_f: 42,
    avg_temp_july_f: 88,
    climate_description: "Mild winters and warm summers. Outdoor tennis is playable most of the year.",
    campus_description: "Gothic architecture on 8,600 wooded acres. Research university with strong athletics tradition.",
    notes: "Looking for baseline depth",
  },
  {
    email: "jpark@berkeley.edu",
    coach_name: "James Park",
    school_name: "UC Berkeley",
    division: "D1",
    gender: "Men",
    head_coach_name: "James Park",
    assistant_coaches: null,
    team_utr: 12.8,
    team_wtn: 5.0,
    ita_team_ranking: 22,
    region: "West",
    conference: "Pac-12",
    roster_size: 9,
    indoor_courts: 0,
    outdoor_courts: 12,
    scholarships_offered: true,
    city: "Berkeley",
    state: "CA",
    website: "https://calbears.com",
    tuition_in_state: 14312,
    tuition_out_of_state: 44066,
    room_and_board: 20000,
    total_annual_cost: 64066,
    acceptance_rate: 11,
    student_population: 45000,
    avg_sat_score: 1415,
    degrees_offered: "Engineering, Business, Letters & Science, Environmental Design",
    housing_on_campus: true,
    setting: "Urban",
    nearest_airport: "San Francisco International (SFO)",
    distance_to_airport_miles: 25,
    avg_temp_jan_f: 52,
    avg_temp_july_f: 70,
    climate_description: "Mediterranean climate. Mild year-round, perfect for outdoor tennis.",
    campus_description: "Flagship of the UC system, set in the hills above San Francisco Bay.",
    notes: null,
  },
  {
    email: "etorres@umich.edu",
    coach_name: "Elena Torres",
    school_name: "University of Michigan",
    division: "D1",
    gender: "Women",
    head_coach_name: "Elena Torres",
    assistant_coaches: "Ryan Kim",
    team_utr: 12.1,
    team_wtn: 5.6,
    ita_team_ranking: 34,
    region: "Midwest",
    conference: "Big Ten",
    roster_size: 12,
    indoor_courts: 8,
    outdoor_courts: 6,
    scholarships_offered: true,
    city: "Ann Arbor",
    state: "MI",
    website: "https://mgoblue.com",
    tuition_in_state: 16736,
    tuition_out_of_state: 53232,
    room_and_board: 12000,
    total_annual_cost: 65232,
    acceptance_rate: 17,
    student_population: 48000,
    avg_sat_score: 1435,
    degrees_offered: "Engineering, Business, LSA, Kinesiology, Medicine",
    housing_on_campus: true,
    setting: "College Town",
    nearest_airport: "Detroit Metropolitan (DTW)",
    distance_to_airport_miles: 35,
    avg_temp_jan_f: 26,
    avg_temp_july_f: 83,
    climate_description: "Cold winters with significant snowfall; warm summers. Indoor courts essential in winter.",
    campus_description: "One of the oldest public universities in the US. Vibrant college town with 48,000 students.",
    notes: "Rebuilding doubles lineup",
  },
  {
    email: "rkim@umich.edu",
    coach_name: "Ryan Kim",
    school_name: "University of Michigan",
    division: "D1",
    gender: "Men",
    head_coach_name: "Ryan Kim",
    assistant_coaches: null,
    team_utr: 11.9,
    team_wtn: 6.0,
    ita_team_ranking: 41,
    region: "Midwest",
    conference: "Big Ten",
    roster_size: 11,
    indoor_courts: 8,
    outdoor_courts: 6,
    scholarships_offered: true,
    city: "Ann Arbor",
    state: "MI",
    website: "https://mgoblue.com",
    tuition_in_state: 16736,
    tuition_out_of_state: 53232,
    room_and_board: 12000,
    total_annual_cost: 65232,
    acceptance_rate: 17,
    student_population: 48000,
    avg_sat_score: 1435,
    degrees_offered: "Engineering, Business, LSA, Kinesiology, Medicine",
    housing_on_campus: true,
    setting: "College Town",
    nearest_airport: "Detroit Metropolitan (DTW)",
    distance_to_airport_miles: 35,
    avg_temp_jan_f: 26,
    avg_temp_july_f: 83,
    climate_description: "Cold winters with significant snowfall; warm summers. Indoor courts essential in winter.",
    campus_description: "One of the oldest public universities in the US. Vibrant college town with 48,000 students.",
    notes: null,
  },
  {
    email: "lchen@williams.edu",
    coach_name: "Lisa Chen",
    school_name: "Williams College",
    division: "D3",
    gender: null,
    head_coach_name: "Lisa Chen",
    assistant_coaches: "Mark White",
    team_utr: 10.5,
    team_wtn: 7.8,
    ita_team_ranking: 5,
    region: "New England",
    conference: "NESCAC",
    roster_size: 9,
    indoor_courts: 4,
    outdoor_courts: 8,
    scholarships_offered: false,
    city: "Williamstown",
    state: "MA",
    website: "https://williams.edu",
    tuition_in_state: 64970,
    tuition_out_of_state: 64970,
    room_and_board: 16400,
    total_annual_cost: 81370,
    acceptance_rate: 9,
    student_population: 2200,
    avg_sat_score: 1490,
    degrees_offered: "Liberal Arts",
    housing_on_campus: true,
    setting: "Rural",
    nearest_airport: "Albany International (ALB)",
    distance_to_airport_miles: 45,
    avg_temp_jan_f: 18,
    avg_temp_july_f: 81,
    climate_description: "Cold New England winters. Most practice moves indoors November through March.",
    campus_description: "Top-ranked liberal arts college in the Berkshires. Intimate 2,200-student community.",
    notes: "Strong academics fit",
  },
  {
    email: "mwhite@williams.edu",
    coach_name: "Mark White",
    school_name: "Williams College",
    division: "D3",
    gender: null,
    head_coach_name: "Lisa Chen",
    assistant_coaches: "Mark White",
    team_utr: 10.2,
    team_wtn: 8.0,
    ita_team_ranking: 5,
    region: "New England",
    conference: "NESCAC",
    roster_size: 9,
    indoor_courts: 4,
    outdoor_courts: 8,
    scholarships_offered: false,
    city: "Williamstown",
    state: "MA",
    website: "https://williams.edu",
    tuition_in_state: 64970,
    tuition_out_of_state: 64970,
    room_and_board: 16400,
    total_annual_cost: 81370,
    acceptance_rate: 9,
    student_population: 2200,
    avg_sat_score: 1490,
    degrees_offered: "Liberal Arts",
    housing_on_campus: true,
    setting: "Rural",
    nearest_airport: "Albany International (ALB)",
    distance_to_airport_miles: 45,
    avg_temp_jan_f: 18,
    avg_temp_july_f: 81,
    climate_description: "Cold New England winters. Most practice moves indoors November through March.",
    campus_description: "Top-ranked liberal arts college in the Berkshires. Intimate 2,200-student community.",
    notes: null,
  },
  {
    email: "agarcia@asu.edu",
    coach_name: "Ana Garcia",
    school_name: "Arizona State University",
    division: "D1",
    gender: "Women",
    head_coach_name: "Ana Garcia",
    assistant_coaches: null,
    team_utr: 12.5,
    team_wtn: 5.3,
    ita_team_ranking: 18,
    region: "Southwest",
    conference: "Big 12",
    roster_size: 10,
    indoor_courts: 2,
    outdoor_courts: 14,
    scholarships_offered: true,
    city: "Tempe",
    state: "AZ",
    website: "https://thesundevils.com",
    tuition_in_state: 12720,
    tuition_out_of_state: 35396,
    room_and_board: 13000,
    total_annual_cost: 48396,
    acceptance_rate: 88,
    student_population: 77000,
    avg_sat_score: 1200,
    degrees_offered: "Business, Engineering, Arts & Sciences, Education, Health Solutions",
    housing_on_campus: true,
    setting: "Urban",
    nearest_airport: "Phoenix Sky Harbor (PHX)",
    distance_to_airport_miles: 5,
    avg_temp_jan_f: 66,
    avg_temp_july_f: 105,
    climate_description: "Hot desert climate. Summer heat limits outdoor play July–August; outdoor tennis ideal Oct–May.",
    campus_description: "One of the largest US universities by enrollment. Innovation-focused urban campus in metro Phoenix.",
    notes: null,
  },
  {
    email: "tnguyen@trincoll.edu",
    coach_name: "Tom Nguyen",
    school_name: "Trinity College",
    division: "D3",
    gender: null,
    head_coach_name: "Tom Nguyen",
    assistant_coaches: null,
    team_utr: 9.8,
    team_wtn: 8.5,
    ita_team_ranking: null,
    region: "New England",
    conference: "NESCAC",
    roster_size: 8,
    indoor_courts: 3,
    outdoor_courts: 6,
    scholarships_offered: false,
    city: "Hartford",
    state: "CT",
    website: "https://trincoll.edu",
    tuition_in_state: 64740,
    tuition_out_of_state: 64740,
    room_and_board: 16200,
    total_annual_cost: 80940,
    acceptance_rate: 33,
    student_population: 2200,
    avg_sat_score: 1360,
    degrees_offered: "Liberal Arts",
    housing_on_campus: true,
    setting: "Urban",
    nearest_airport: "Bradley International (BDL)",
    distance_to_airport_miles: 15,
    avg_temp_jan_f: 25,
    avg_temp_july_f: 83,
    climate_description: "Classic New England climate. Cold winters; warm humid summers.",
    campus_description: "Liberal arts college in Hartford with a distinctive chapel and strong tennis tradition.",
    notes: "Open roster spots",
  },
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
  const info = extractSchoolInfo(coaches[0]!) ?? NULL_SCHOOL_INFO;

  return {
    ...summary,
    info,
    coaches: coaches.map((coach, i) => ({
      email: coach.email,
      coach_name: coach.coach_name,
      gender: coach.gender,
      head_coach_name: coach.head_coach_name,
      assistant_coaches: coach.assistant_coaches,
      team_utr: coach.team_utr,
      team_wtn: coach.team_wtn,
      ita_team_ranking: coach.ita_team_ranking,
      conference: coach.conference,
      roster_size: coach.roster_size,
      indoor_courts: coach.indoor_courts,
      outdoor_courts: coach.outdoor_courts,
      scholarships_offered: coach.scholarships_offered,
      notes: coach.notes,
      email_sent: i === 0,
      opened: i === 0,
      replied: false,
    })),
  };
}
