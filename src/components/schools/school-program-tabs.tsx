"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import type { SchoolCoach } from "@/lib/types/school";

type Program = { label: string; coaches: SchoolCoach[] };

function utrToWtn(utr: number) {
  return Math.round(Math.max(0, Math.min(40, 43.5 - 3 * utr)) * 10) / 10;
}
function wtnToUtr(wtn: number) {
  return Math.round(Math.max(0, Math.min(16, (43.5 - wtn) / 3)) * 10) / 10;
}

function average(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function OutreachBadge({ coach }: { coach: SchoolCoach }) {
  if (coach.replied) return <Badge>Replied</Badge>;
  if (coach.opened) return <Badge variant="secondary">Opened</Badge>;
  if (coach.email_sent) return <Badge variant="outline">Sent</Badge>;
  return <Badge variant="ghost">Not contacted</Badge>;
}

function ProgramSection({ program }: { program: Program }) {
  const { label, coaches } = program;
  const namedCoaches = coaches.filter((c) => c.coach_name?.trim());
  const first = coaches[0]!;
  const avgUtr = average(coaches.map((c) => c.team_utr));
  const avgWtn = average(coaches.map((c) => c.team_wtn));

  const rosterSize = first.roster_size;
  const itaRank = first.ita_team_ranking;
  const conference = first.conference;
  const scholarships = first.scholarships_offered;
  const assistants = first.assistant_coaches;

  const hasStats = avgUtr != null || avgWtn != null || rosterSize != null || itaRank != null;
  const hasUtrData = coaches.some((c) => c.team_utr != null);

  const wtnDisplay =
    avgWtn != null
      ? avgWtn.toFixed(1)
      : avgUtr != null
      ? `~${utrToWtn(avgUtr).toFixed(1)}`
      : "—";

  const utrDisplay =
    avgUtr != null
      ? avgUtr.toFixed(1)
      : avgWtn != null
      ? `~${wtnToUtr(avgWtn).toFixed(1)}`
      : "—";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold">{label}</h3>
        {itaRank != null && (
          <Badge variant="secondary" className="gap-1">
            <Trophy className="size-3" />
            ITA #{itaRank}
          </Badge>
        )}
        {conference && (
          <span className="text-sm text-muted-foreground">{conference}</span>
        )}
        {scholarships === true && (
          <Badge variant="outline" className="text-xs">Scholarships</Badge>
        )}
      </div>

      {assistants && (
        <p className="text-xs text-muted-foreground">Assistant coaches: {assistants}</p>
      )}

      {hasStats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Avg UTR" value={utrDisplay} />
          <StatCard label="Avg WTN" value={wtnDisplay} />
          <StatCard label="Roster" value={rosterSize ?? "—"} />
          <StatCard label="ITA Rank" value={itaRank != null ? `#${itaRank}` : "—"} />
        </div>
      )}

      {hasUtrData && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>UTR by Coach</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <SchoolUtrChart coaches={namedCoaches} />
          </GlassCardContent>
        </GlassCard>
      )}

      {namedCoaches.length > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Coaching Staff</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coach</TableHead>
                  <TableHead>UTR</TableHead>
                  <TableHead>WTN</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {namedCoaches.map((coach) => {
                  const isHead =
                    coach.head_coach_name != null &&
                    coach.coach_name === coach.head_coach_name;
                  const dispUtr = coach.team_utr != null
                    ? coach.team_utr.toFixed(1)
                    : coach.team_wtn != null
                    ? `~${wtnToUtr(coach.team_wtn).toFixed(1)}`
                    : "—";
                  const dispWtn = coach.team_wtn != null
                    ? coach.team_wtn.toFixed(1)
                    : coach.team_utr != null
                    ? `~${utrToWtn(coach.team_utr).toFixed(1)}`
                    : "—";
                  return (
                    <TableRow key={coach.email}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{coach.coach_name}</span>
                          {isHead && (
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                              HC
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{dispUtr}</TableCell>
                      <TableCell className="text-muted-foreground">{dispWtn}</TableCell>
                      <TableCell className="max-w-64 truncate text-muted-foreground">
                        {coach.notes ?? "—"}
                      </TableCell>
                      <TableCell>
                        <OutreachBadge coach={coach} />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/compose?coaches=${encodeURIComponent(coach.email)}`}
                          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                          title={`Compose email to ${coach.coach_name}`}
                          aria-label={`Compose email to ${coach.coach_name}`}
                        >
                          <Mail className="size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}

export function SchoolProgramTabs({ programs }: { programs: Program[] }) {
  const [active, setActive] = useState(0);

  if (programs.length <= 1) {
    return programs[0] ? <ProgramSection program={programs[0]} /> : null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1 w-fit">
        {programs.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setActive(i)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
              active === i
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <ProgramSection program={programs[active]!} />
    </div>
  );
}
