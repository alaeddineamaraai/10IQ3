import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSchools, getSampleSchools } from "@/lib/data/schools";
import { Badge } from "@/components/ui/badge";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <Link key={school.school_name} href={`/schools/${encodeURIComponent(school.school_name)}`}>
            <GlassCard className="transition-smooth h-full hover:-translate-y-0.5 hover:shadow-lg">
              <GlassCardHeader>
                <div className="flex items-start justify-between gap-2">
                  <GlassCardTitle className="leading-snug">{school.school_name}</GlassCardTitle>
                  <Badge variant="secondary">{school.division}</Badge>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-4" />
                  {school.coach_count} coach{school.coach_count === 1 ? "" : "es"}
                </span>
                <span>
                  {school.avg_utr != null ? `UTR ${school.avg_utr.toFixed(1)}` : "—"}
                </span>
              </GlassCardContent>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
