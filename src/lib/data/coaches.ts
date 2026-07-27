import type { SupabaseClient } from "@supabase/supabase-js";

import type { Coach, CoachWithOutreach } from "@/lib/types/coach";

export type CoachStatus = "all" | "not_contacted" | "sent" | "opened" | "replied";
export type CoachSortKey = "utr_desc" | "utr_asc" | "wtn_desc" | "wtn_asc" | "name_asc" | "school_asc";

export type CoachesPageOptions = {
  search?: string;
  division?: string;
  region?: string;
  status?: CoachStatus;
  minUtr?: number;
  maxUtr?: number;
  minWtn?: number;
  maxWtn?: number;
  sort?: CoachSortKey;
  page?: number;
  pageSize?: number;
};

export type CoachesPageResult = {
  coaches: CoachWithOutreach[];
  total: number;
};

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

// Postgres `numeric` columns come back from PostgREST as strings, not
// numbers, even though the Coach type says `number | null`. Coerce here so
// downstream math and rendering (.toFixed()) don't break.
function normalizeCoach<T extends Coach>(coach: T): T {
  return {
    ...coach,
    team_utr: toNumber(coach.team_utr),
    team_wtn: toNumber(coach.team_wtn),
  };
}

// PostgREST caps every request at the project's "Max Rows" setting
// (1000 by default), so a plain .select("*") silently truncates once
// coaches_database grows past that — this happened for real at ~1,800
// rows. Page through with .range() until a page comes back short to
// reliably fetch every row regardless of table size or that setting.
const FETCH_PAGE_SIZE = 500;

export async function fetchAllCoaches<T = Coach>(
  supabase: SupabaseClient,
  columns = "*"
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("coaches_database")
      .select(columns)
      .range(from, from + FETCH_PAGE_SIZE - 1)
      .returns<T[]>();

    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...data);
    from += data.length;

    if (data.length < FETCH_PAGE_SIZE) break;
  }

  return rows;
}

/**
 * coaches_database is shared/global and read-only from the client. Per-user
 * send state lives in `outreach`, scoped by RLS to auth.uid(). This merges
 * the two so a coach already emailed by User A doesn't show as "contacted"
 * for User B — the bug the old single shared-row design had.
 */
export async function getCoachesWithOutreach(
  supabase: SupabaseClient,
  userId: string
): Promise<CoachWithOutreach[]> {
  const [coaches, { data: outreach, error: outreachError }] = await Promise.all([
    fetchAllCoaches<Coach>(supabase),
    supabase
      .from("outreach")
      .select("*")
      .eq("user_id", userId),
  ]);

  // Degrade gracefully if the `outreach` table/migration isn't in place yet
  // (e.g. not-yet-applied migration) — browsing coaches shouldn't 500 just
  // because per-user send state is unavailable.
  if (outreachError) {
    console.error("getCoachesWithOutreach: outreach query failed", outreachError);
  }

  const outreachByCoach = new Map(
    (outreachError ? [] : outreach ?? []).map((row) => [row.coach_email, row])
  );

  return coaches.map((coach) => ({
    ...normalizeCoach(coach),
    outreach: outreachByCoach.get(coach.email) ?? null,
  }));
}

export async function getCoachesPage(
  supabase: SupabaseClient,
  userId: string,
  opts: CoachesPageOptions = {}
): Promise<CoachesPageResult> {
  const {
    search, division, region, status, minUtr, maxUtr, minWtn, maxWtn,
    sort = "utr_desc", page = 1, pageSize = 50,
  } = opts;

  // Fetch all coaches and the user's outreach in parallel — same strategy as
  // getCoachesWithOutreach, but applies filters + pagination on top.
  const [allCoaches, { data: outreach, error: outreachError }] = await Promise.all([
    fetchAllCoaches<Coach>(supabase),
    supabase.from("outreach").select("*").eq("user_id", userId),
  ]);

  if (outreachError) console.error("getCoachesPage: outreach query failed", outreachError);

  const outreachByCoach = new Map(
    (outreachError ? [] : outreach ?? []).map((row) => [row.coach_email, row])
  );

  let coaches: CoachWithOutreach[] = allCoaches.map((c) => ({
    ...normalizeCoach(c),
    outreach: outreachByCoach.get(c.email) ?? null,
  }));

  // ── Filters ────────────────────────────────────────────────────────────────
  if (search) {
    const q = search.toLowerCase();
    coaches = coaches.filter((c) =>
      c.coach_name?.toLowerCase().includes(q) ||
      c.school_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }

  if (division) coaches = coaches.filter((c) => c.division === division);
  if (region) coaches = coaches.filter((c) => c.region === region);

  if (status && status !== "all") {
    coaches = coaches.filter((c) => {
      if (status === "not_contacted") return !c.outreach?.email_sent;
      if (status === "sent") return c.outreach?.email_sent && !c.outreach.opened && !c.outreach.replied;
      if (status === "opened") return c.outreach?.opened && !c.outreach.replied;
      if (status === "replied") return c.outreach?.replied;
      return true;
    });
  }

  if (minUtr != null) coaches = coaches.filter((c) => (c.team_utr ?? -Infinity) >= minUtr);
  if (maxUtr != null) coaches = coaches.filter((c) => (c.team_utr ?? Infinity) <= maxUtr);
  if (minWtn != null) coaches = coaches.filter((c) => (c.team_wtn ?? -Infinity) >= minWtn);
  if (maxWtn != null) coaches = coaches.filter((c) => (c.team_wtn ?? Infinity) <= maxWtn);

  // ── Sort ───────────────────────────────────────────────────────────────────
  const fallback = (v: number | null, dir: 1 | -1) => v ?? (dir === 1 ? -Infinity : Infinity);
  coaches = [...coaches].sort((a, b) => {
    switch (sort) {
      case "utr_asc":  return fallback(a.team_utr, 1) - fallback(b.team_utr, 1);
      case "utr_desc": return fallback(b.team_utr, -1) - fallback(a.team_utr, -1);
      case "wtn_asc":  return fallback(a.team_wtn, 1) - fallback(b.team_wtn, 1);
      case "wtn_desc": return fallback(b.team_wtn, -1) - fallback(a.team_wtn, -1);
      case "name_asc":   return (a.coach_name ?? "").localeCompare(b.coach_name ?? "");
      case "school_asc": return (a.school_name ?? "").localeCompare(b.school_name ?? "");
    }
  });

  const total = coaches.length;
  const from = (page - 1) * pageSize;
  return { coaches: coaches.slice(from, from + pageSize), total };
}

const REGIONS = ["Northeast", "Southeast", "Midwest", "West", "Southwest"];
const DIVISIONS = ["D1", "D2", "D3", "NAIA", "JUCO"];
const SCHOOLS = [
  "Duke University",
  "UC Berkeley",
  "University of Michigan",
  "Williams College",
  "Arizona State University",
  "Trinity College",
  "Vanderbilt University",
  "University of Florida",
  "Pomona College",
  "Emory University",
];
const FIRST_NAMES = ["Sarah", "James", "Elena", "Ryan", "Lisa", "Mark", "Ana", "Tom", "Maya", "Jordan", "Chris", "Priya"];
const LAST_NAMES = ["Mitchell", "Park", "Torres", "Kim", "Chen", "White", "Garcia", "Nguyen", "Patel", "Reed", "Bailey", "Shah"];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getSampleCoaches(count = 24): CoachWithOutreach[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const school = SCHOOLS[i % SCHOOLS.length];
    const division = DIVISIONS[i % DIVISIONS.length];
    const region = REGIONS[i % REGIONS.length];
    const utr = Math.round((9 + seededRandom(i + 1) * 5) * 10) / 10;
    const wtn = Math.round((3 + seededRandom(i + 50) * 7) * 10) / 10;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@${school
      .split(" ")
      .pop()
      ?.toLowerCase()}.edu`;
    const sent = i % 4 === 0;
    const opened = sent && i % 8 === 0;
    const replied = opened && i % 16 === 0;

    return {
      email,
      coach_name: `${first} ${last}`,
      school_name: school,
      division,
      team_utr: utr,
      team_wtn: wtn,
      notes: i % 5 === 0 ? "Open roster spots for next class" : null,
      region,
      outreach: sent
        ? {
            id: String(i),
            user_id: "sample",
            coach_email: email,
            email_sent: true,
            sent_at: new Date(Date.now() - i * 86400000).toISOString(),
            subject: "Introduction from a recruit",
            body: null,
            opened,
            replied,
            opened_at: opened ? new Date(Date.now() - i * 86400000).toISOString() : null,
            replied_at: replied ? new Date(Date.now() - i * 86400000).toISOString() : null,
            reply_viewed_at: null,
            resend_email_id: null,
            created_at: new Date(Date.now() - i * 86400000).toISOString(),
          }
        : null,
    };
  });
}
