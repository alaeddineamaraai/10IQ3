import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSchoolDetail, getSampleSchoolDetail } from "@/lib/data/schools";
import { Badge } from "@/components/ui/badge";
import { SchoolDetailContent } from "@/components/schools/school-detail-content";

async function loadSchoolDetail(schoolName: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { detail: getSampleSchoolDetail(schoolName), isSample: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  return {
    detail: await getSchoolDetail(supabase, schoolName, auth.user?.id ?? null),
    isSample: false,
  };
}

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ school: string }>;
}) {
  const { school } = await params;
  const schoolName = decodeURIComponent(school);
  const { detail, isSample } = await loadSchoolDetail(schoolName);

  if (!detail) notFound();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <Link
          href="/schools"
          className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All schools
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{detail.school_name}</h1>
          <Badge variant="secondary">{detail.division}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {isSample
            ? "Sample data — preview only."
            : `${detail.coach_count} coach${detail.coach_count === 1 ? "" : "es"} on staff.`}
        </p>
      </div>

      <SchoolDetailContent detail={detail} />
    </div>
  );
}
