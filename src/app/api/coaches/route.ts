import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCoachesPage, type CoachSortKey, type CoachStatus } from "@/lib/data/coaches";

const MAX_PAGE_SIZE = 100;
const VALID_STATUSES: CoachStatus[] = ["all", "not_contacted", "sent", "opened", "replied"];
const VALID_SORTS: CoachSortKey[] = [
  "utr_desc", "utr_asc", "wtn_desc", "wtn_asc", "name_asc", "school_asc",
];

function parseNumber(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseNumber(searchParams.get("page")) ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseNumber(searchParams.get("pageSize")) ?? 50)
  );

  const statusParam = searchParams.get("status");
  const status = VALID_STATUSES.includes(statusParam as CoachStatus)
    ? (statusParam as CoachStatus)
    : "all";

  const sortParam = searchParams.get("sort");
  const sort = VALID_SORTS.includes(sortParam as CoachSortKey)
    ? (sortParam as CoachSortKey)
    : "utr_desc";

  try {
    const result = await getCoachesPage(supabase, auth.user.id, {
      search: searchParams.get("search")?.trim() || undefined,
      division: searchParams.get("division") || undefined,
      region: searchParams.get("region") || undefined,
      status,
      minUtr: parseNumber(searchParams.get("minUtr")),
      maxUtr: parseNumber(searchParams.get("maxUtr")),
      minWtn: parseNumber(searchParams.get("minWtn")),
      maxWtn: parseNumber(searchParams.get("maxWtn")),
      sort,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load coaches" },
      { status: 500 }
    );
  }
}
