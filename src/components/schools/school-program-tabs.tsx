"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Mail, Trophy, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";
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

type StatusInfo = { label: string; dot: string; badge: string };

function coachStatus(coach: SchoolCoach): StatusInfo {
  if (coach.replied)
    return { label: "Replied", dot: "bg-primary", badge: "bg-primary/10 text-primary border-primary/20" };
  if (coach.opened)
    return {
      label: "Opened",
      dot: "bg-emerald-500",
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };
  if (coach.email_sent)
    return {
      label: "Sent",
      dot: "bg-blue-500",
      badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    };
  return {
    label: "Not contacted",
    dot: "bg-muted-foreground/25",
    badge: "bg-muted/60 text-muted-foreground border-border",
  };
}

function MetricTile({
  label,
  value,
  helpText,
  icon: Icon,
}: {
  label: string;
  value: string;
  helpText: string;
  icon: LucideIcon;
}) {
  return (
    <div className="surface-card rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground leading-relaxed">{helpText}</span>
    </div>
  );
}

function CoachRow({ coach }: { coach: SchoolCoach }) {
  const status = coachStatus(coach);
  const isHead =
    coach.head_coach_name != null && coach.coach_name === coach.head_coach_name;

  const dispUtr =
    coach.team_utr != null
      ? coach.team_utr.toFixed(1)
      : coach.team_wtn != null
      ? `~${wtnToUtr(coach.team_wtn).toFixed(1)}`
      : null;
  const dispWtn =
    coach.team_wtn != null
      ? coach.team_wtn.toFixed(1)
      : coach.team_utr != null
      ? `~${utrToWtn(coach.team_utr).toFixed(1)}`
      : null;

  const metaParts = [
    dispUtr ? `UTR ${dispUtr}` : null,
    dispWtn ? `WTN ${dispWtn}` : null,
    coach.notes ?? null,
  ].filter(Boolean);

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/40">
      {/* Status dot */}
      <div className={cn("size-2 shrink-0 rounded-full", status.dot)} />

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{coach.coach_name}</span>
          <span className="text-xs text-muted-foreground">
            {isHead ? "Head Coach" : "Assistant"}
          </span>
        </div>
        {metaParts.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {metaParts.join(" · ")}
          </p>
        )}
      </div>

      {/* Status badge — hidden on mobile */}
      <span
        className={cn(
          "hidden shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium sm:block",
          status.badge
        )}
      >
        {status.label}
      </span>

      {/* Contact button — fades in on hover */}
      <Link
        href={`/compose?coaches=${encodeURIComponent(coach.email)}`}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5",
          "text-xs font-medium transition-colors",
          "border-border text-muted-foreground",
          "hover:border-primary/40 hover:text-primary",
          "opacity-0 group-hover:opacity-100"
        )}
        title={`Compose email to ${coach.coach_name}`}
      >
        <Mail className="size-3" />
        <span className="hidden sm:inline">Contact</span>
      </Link>
    </div>
  );
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

  const contactAllHref =
    namedCoaches.length > 0
      ? `/compose?coaches=${namedCoaches.map((c) => encodeURIComponent(c.email)).join(",")}`
      : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Program header */}
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
          <Badge variant="outline" className="text-xs">
            Scholarships
          </Badge>
        )}
      </div>

      {assistants && (
        <p className="-mt-3 text-xs text-muted-foreground">
          Assistant coaches: {assistants}
        </p>
      )}

      {/* Metrics 2×2 */}
      {hasStats && (
        <div className="grid grid-cols-2 gap-3">
          <MetricTile
            label="Avg UTR"
            value={utrDisplay}
            helpText="Universal Tennis Rating — 0 to 16.5, higher is stronger"
            icon={BarChart3}
          />
          <MetricTile
            label="Avg WTN"
            value={wtnDisplay}
            helpText="World Tennis Number — 0 to 40, lower is stronger"
            icon={BarChart3}
          />
          <MetricTile
            label="Roster Size"
            value={rosterSize != null ? String(rosterSize) : "—"}
            helpText="Players on the current team roster"
            icon={Users}
          />
          <MetricTile
            label="ITA Rank"
            value={itaRank != null ? `#${itaRank}` : "—"}
            helpText="Intercollegiate Tennis Association national ranking"
            icon={Trophy}
          />
        </div>
      )}

      {/* UTR chart */}
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

      {/* Coaching staff */}
      {namedCoaches.length > 0 && (
        <div className="flex flex-col gap-2">
          {/* Header + Contact All */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Coaching Staff · {namedCoaches.length}
            </span>
            {contactAllHref && (
              <Link
                href={contactAllHref}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5",
                  "text-xs font-medium transition-colors",
                  "border-border text-muted-foreground",
                  "hover:border-primary/40 hover:text-primary"
                )}
              >
                <Mail className="size-3.5" />
                Contact All
              </Link>
            )}
          </div>

          {/* Coach list */}
          <GlassCard>
            <GlassCardContent className="p-2">
              <div className="flex flex-col divide-y divide-border/50">
                {namedCoaches.map((coach) => (
                  <CoachRow key={coach.email} coach={coach} />
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
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
    <div className="flex flex-col gap-5">
      {/* Underline tab strip */}
      <div className="flex border-b border-border">
        {programs.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setActive(i)}
            className={cn(
              "-mb-px border-b-2 px-5 py-2.5 text-sm font-medium transition-all",
              active === i
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
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
