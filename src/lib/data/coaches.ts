import type { SupabaseClient } from "@supabase/supabase-js";

import type { Coach, CoachWithOutreach, Outreach, OutreachReply } from "@/lib/types/coach";

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

export type CoachStatus = "all" | "not_contacted" | "sent" | "opened" | "replied";
export type CoachSortKey = "utr_desc" | "utr_asc" | "wtn_desc" | "wtn_asc" | "name_asc" | "school_asc";

export type CoachesPageFilters = {
  search?: string;
  division?: string;
  region?: string;
  status?: CoachStatus;
  minUtr?: number;
  maxUtr?: number;
  minWtn?: number;
  maxWtn?: number;
  sort?: CoachSortKey;
  page: number;
  pageSize: number;
};

function statusOfRow(row: Outreach | undefined): Exclude<CoachStatus, "all"> {
  if (row?.replied) return "replied";
  if (row?.opened) return "opened";
  if (row?.email_sent) return "sent";
  return "not_contacted";
}

/**
 * Server-side filtered + paginated coach listing, replacing the old
 * pattern of shipping the entire (1,800+ row, growing) coaches_database
 * table to the client on every /contacts load and slicing it in React.
 *
 * Status filtering can't be a `where` on coaches_database (contacted state
 * lives in the per-user `outreach` table), so this fetches the athlete's
 * own outreach rows first — small and already indexed on user_id — and
 * uses that bounded set to narrow the coaches_database query by email
 * before applying `.range()`, rather than trying to filter/paginate the
 * unbounded table in memory.
 */
export async function getCoachesPage(
  supabase: SupabaseClient,
  userId: string,
  filters: CoachesPageFilters
): Promise<{ coaches: CoachWithOutreach[]; total: number }> {
  const {
    search, division, region, status = "all",
    minUtr, maxUtr, minWtn, maxWtn, sort = "utr_desc", page, pageSize,
  } = filters;

  const { data: outreachRows, error: outreachError } = await supabase
    .from("outreach")
    .select("*")
    .eq("user_id", userId)
    .returns<Outreach[]>();

  if (outreachError) throw outreachError;

  const outreachByEmail = new Map((outreachRows ?? []).map((o) => [o.coach_email, o]));

  let query = supabase.from("coaches_database").select("*", { count: "exact" });

  if (search) {
    // Escape PostgREST's ilike wildcards so a literal "%" or "_" in the
    // search box is treated as a literal character, not a pattern.
    const escaped = search.replace(/[%_]/g, "\\$&");
    query = query.or(`coach_name.ilike.%${escaped}%,school_name.ilike.%${escaped}%`);
  }
  if (division) query = query.eq("division", division);
  if (region) query = query.eq("region", region);
  if (minUtr != null) query = query.gte("team_utr", minUtr);
  if (maxUtr != null) query = query.lte("team_utr", maxUtr);
  if (minWtn != null) query = query.gte("team_wtn", minWtn);
  if (maxWtn != null) query = query.lte("team_wtn", maxWtn);

  if (status !== "all") {
    if (status === "not_contacted") {
      // Anti-join against the (small, per-user) set of already-sent coach
      // emails — coaches_database has no column of its own to filter on.
      const contactedEmails = (outreachRows ?? [])
        .filter((o) => o.email_sent)
        .map((o) => o.coach_email);
      if (contactedEmails.length > 0) {
        query = query.not("email", "in", `(${contactedEmails.join(",")})`);
      }
    } else {
      const matchingEmails = (outreachRows ?? [])
        .filter((o) => statusOfRow(o) === status)
        .map((o) => o.coach_email);
      if (matchingEmails.length === 0) return { coaches: [], total: 0 };
      query = query.in("email", matchingEmails);
    }
  }

  const sortColumn: Record<CoachSortKey, string> = {
    utr_desc: "team_utr",
    utr_asc: "team_utr",
    wtn_desc: "team_wtn",
    wtn_asc: "team_wtn",
    name_asc: "coach_name",
    school_asc: "school_name",
  };
  const ascending = sort === "utr_asc" || sort === "wtn_asc" || sort === "name_asc" || sort === "school_asc";

  query = query
    .order(sortColumn[sort], { ascending, nullsFirst: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query.returns<Coach[]>();
  if (error) throw error;

  const coaches = (data ?? []).map((coach) => ({
    ...normalizeCoach(coach),
    outreach: outreachByEmail.get(coach.email) ?? null,
  }));

  return { coaches, total: count ?? 0 };
}

export async function getCoachProfile(
  supabase: SupabaseClient,
  userId: string,
  coachEmail: string
): Promise<import("@/lib/types/coach").CoachProfile | null> {
  const [{ data: coach }, { data: outreach }] = await Promise.all([
    supabase
      .from("coaches_database")
      .select("*")
      .eq("email", coachEmail)
      .maybeSingle<Coach>(),
    supabase
      .from("outreach")
      .select("*")
      .eq("user_id", userId)
      .eq("coach_email", coachEmail)
      .maybeSingle<Outreach>(),
  ]);

  if (!coach) return null;

  let replies: OutreachReply[] = [];
  if (outreach) {
    const { data: repliesData } = await supabase
      .from("outreach_replies")
      .select("*")
      .eq("outreach_id", outreach.id)
      .order("received_at", { ascending: true })
      .returns<OutreachReply[]>();
    replies = repliesData ?? [];
  }

  return {
    ...normalizeCoach(coach),
    outreach: outreach ? { ...outreach, replies } : null,
  };
}

export function getSampleCoachProfile(coachEmail: string): import("@/lib/types/coach").CoachProfile | null {
  const coaches = getSampleCoaches();
  const coach = coaches.find((c) => c.email === coachEmail);
  if (!coach) return null;
  // Enrich with fake replies if this coach replied
  const replies = coach.outreach?.replied
    ? [
        {
          id: "r1",
          outreach_id: coach.outreach!.id,
          from_email: coachEmail,
          subject: `Re: ${coach.outreach!.subject}`,
          body: "Thanks for reaching out! Your profile looks interesting — could you send over a highlight reel and your fall tournament schedule?",
          received_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        },
      ]
    : [];
  return {
    ...coach,
    outreach: coach.outreach ? { ...coach.outreach, replies } : null,
  };
}

export const REGIONS = ["Northeast", "Southeast", "Midwest", "West", "Southwest"];
export const DIVISIONS = ["D1", "D2", "D3", "NAIA", "JUCO"];
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
  "Stanford University",
  "University of Georgia",
  "Ohio State University",
  "University of Texas",
  "Northwestern University",
  "Baylor University",
  "UCLA",
  "University of Virginia",
  "Wake Forest University",
  "University of Notre Dame",
  "Georgetown University",
  "Boston College",
  "University of Miami",
];
const FIRST_NAMES = [
  "Sarah", "James", "Elena", "Ryan", "Lisa", "Mark", "Ana", "Tom", "Maya", "Jordan",
  "Chris", "Priya", "Daniel", "Nicole", "Marcus", "Olivia", "Kevin", "Grace", "Ben", "Sofia",
];
const LAST_NAMES = [
  "Mitchell", "Park", "Torres", "Kim", "Chen", "White", "Garcia", "Nguyen", "Patel", "Reed",
  "Bailey", "Shah", "Foster", "Cruz", "Bennett", "Okafor", "Hayes", "Novak", "Rivera", "Sullivan",
  "Whitfield",
];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Marketing says 1,800+ coaches, so the demo/sample views should match that
// rather than a small round number that gives away it's fake data.
// FIRST_NAMES (20), LAST_NAMES (21), and SCHOOLS (23) are deliberately
// pairwise-coprime pool sizes, each indexed by a plain `i % length` (never
// `floor(i / n)`, which would pin one field constant for a whole block of
// rows). That makes the combined (first, last, school) triple repeat only
// every 20*21*23 = 9,660 rows — well past the 1,800-row sample set, so no
// two rows share a full identity anywhere, even after sorting by UTR (which
// reorders rows away from generation order and would otherwise surface
// repeats from a shorter cycle sitting right next to each other).
export function getSampleCoaches(count = 1800): CoachWithOutreach[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[i % LAST_NAMES.length];
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
