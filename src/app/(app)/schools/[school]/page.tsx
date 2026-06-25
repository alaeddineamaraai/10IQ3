import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSchoolDetail, getSampleSchoolDetail } from "@/lib/data/schools";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";
import { StatCard } from "@/components/stat-card";
import { SchoolUtrChart } from "@/components/schools/school-utr-chart";

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

  const sentCount = detail.coaches.filter((c) => c.email_sent).length;
  const openedCount = detail.coaches.filter((c) => c.opened).length;
  const repliedCount = detail.coaches.filter((c) => c.replied).length;

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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Coaches" value={detail.coach_count} />
        <StatCard label="Sent" value={sentCount} />
        <StatCard label="Opened" value={openedCount} />
        <StatCard label="Replied" value={repliedCount} />
      </div>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>UTR by Coach</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <SchoolUtrChart coaches={detail.coaches} />
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Roster</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach</TableHead>
                <TableHead>UTR</TableHead>
                <TableHead>WTN</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.coaches.map((coach) => (
                <TableRow key={coach.email}>
                  <TableCell className="font-medium">{coach.coach_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {coach.team_utr?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {coach.team_wtn?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-64 truncate text-muted-foreground">
                    {coach.notes ?? "—"}
                  </TableCell>
                  <TableCell>
                    {coach.replied ? (
                      <Badge>Replied</Badge>
                    ) : coach.opened ? (
                      <Badge variant="secondary">Opened</Badge>
                    ) : coach.email_sent ? (
                      <Badge variant="outline">Sent</Badge>
                    ) : (
                      <Badge variant="ghost">Not contacted</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
