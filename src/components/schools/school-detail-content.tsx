import {
  BadgeDollarSign,
  Building2,
  ExternalLink,
  GraduationCap,
  MapPin,
  Plane,
  Sun,
  Thermometer,
  Trophy,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";
import { SchoolCostChart } from "@/components/schools/school-cost-chart";
import { SchoolClimateChart } from "@/components/schools/school-climate-chart";
import { SchoolProgramTabs } from "@/components/schools/school-program-tabs";
import type { SchoolCoach, SchoolDetail, SchoolInfo } from "@/lib/types/school";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const num = new Intl.NumberFormat("en-US");

function fmt(n: number | null, fallback = "—") {
  return n != null ? num.format(n) : fallback;
}
function fmtCurrency(n: number | null) {
  return n != null ? currency.format(n) : "—";
}
function fmtPct(n: number | null) {
  if (n == null) return "—";
  return n < 1 ? `${Math.round(n * 100)}%` : `${Math.round(n)}%`;
}

type Program = { label: string; coaches: SchoolCoach[] };

function genderLabel(gender: string): string {
  const g = gender.toLowerCase();
  if (g.includes("women") || g.includes("female") || g === "f") return "Women's Tennis";
  if (g.includes("men") || g.includes("male") || g === "m") return "Men's Tennis";
  return "Tennis Program";
}

function buildPrograms(coaches: SchoolCoach[]): Program[] {
  const withGender = coaches.filter((c) => c.gender != null);
  if (withGender.length === 0) {
    return [{ label: "Tennis Program", coaches }];
  }

  const byGender = new Map<string, SchoolCoach[]>();
  for (const coach of coaches) {
    const g = coach.gender ?? "Other";
    const list = byGender.get(g) ?? [];
    list.push(coach);
    byGender.set(g, list);
  }

  const order = ["Women", "Men"];
  const entries = [...byGender.entries()].sort(([a], [b]) => {
    const ai = order.findIndex((o) => a.includes(o));
    const bi = order.findIndex((o) => b.includes(o));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return entries.map(([gender, list]) => ({
    label: genderLabel(gender),
    coaches: list,
  }));
}

function AcademicsCard({ info }: { info: SchoolInfo }) {
  const hasCosts =
    info.tuition_in_state != null ||
    info.tuition_out_of_state != null ||
    info.room_and_board != null ||
    info.total_annual_cost != null;
  const hasStats =
    info.acceptance_rate != null ||
    info.student_population != null ||
    info.avg_sat_score != null;

  if (!hasCosts && !hasStats && !info.degrees_offered) return null;

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <GraduationCap className="size-4 text-muted-foreground" />
          Academics &amp; Costs
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="flex flex-col gap-4">
        {hasCosts && (
          <SchoolCostChart
            data={{
              tuition_in_state: info.tuition_in_state,
              tuition_out_of_state: info.tuition_out_of_state,
              room_and_board: info.room_and_board,
            }}
          />
        )}

        {hasCosts && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">In-state</span>
              <span className="font-semibold tabular-nums">{fmtCurrency(info.tuition_in_state)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Out-of-state</span>
              <span className="font-semibold tabular-nums">{fmtCurrency(info.tuition_out_of_state)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Room &amp; board</span>
              <span className="font-semibold tabular-nums">{fmtCurrency(info.room_and_board)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Total annual cost</span>
              <span className="font-semibold tabular-nums">{fmtCurrency(info.total_annual_cost)}</span>
            </div>
          </div>
        )}

        {hasStats && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {info.acceptance_rate != null && (
              <span>
                <span className="text-muted-foreground">Acceptance rate: </span>
                <span className="font-medium">{fmtPct(info.acceptance_rate)}</span>
              </span>
            )}
            {info.student_population != null && (
              <span>
                <span className="text-muted-foreground">Enrollment: </span>
                <span className="font-medium">{fmt(info.student_population)}</span>
              </span>
            )}
            {info.avg_sat_score != null && (
              <span>
                <span className="text-muted-foreground">Avg SAT: </span>
                <span className="font-medium">{fmt(info.avg_sat_score)}</span>
              </span>
            )}
            {info.housing_on_campus != null && (
              <span>
                <span className="text-muted-foreground">On-campus housing: </span>
                <span className="font-medium">{info.housing_on_campus ? "Yes" : "No"}</span>
              </span>
            )}
          </div>
        )}

        {info.degrees_offered && (
          <div className="text-sm">
            <span className="text-muted-foreground">Degrees: </span>
            <span>{info.degrees_offered}</span>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}

function LocationCard({ info }: { info: SchoolInfo }) {
  const hasClimate = info.avg_temp_jan_f != null || info.avg_temp_july_f != null;
  const hasAirport = info.nearest_airport != null;
  const hasText = info.climate_description != null || info.campus_description != null;

  if (!hasClimate && !hasAirport && !hasText) return null;

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          Campus &amp; Location
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="flex flex-col gap-3 text-sm">
        <SchoolClimateChart
          data={{
            avg_temp_jan_f: info.avg_temp_jan_f,
            avg_temp_july_f: info.avg_temp_july_f,
          }}
        />

        {hasAirport && (
          <div className="flex items-start gap-2">
            <Plane className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span>
              {info.nearest_airport}
              {info.distance_to_airport_miles != null && (
                <span className="text-muted-foreground">
                  {" · "}{fmt(info.distance_to_airport_miles)} mi
                </span>
              )}
            </span>
          </div>
        )}

        {hasClimate && (
          <div className="flex items-start gap-2">
            <Thermometer className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">
              {info.avg_temp_jan_f != null && `Jan avg ${info.avg_temp_jan_f}°F`}
              {info.avg_temp_jan_f != null && info.avg_temp_july_f != null && " · "}
              {info.avg_temp_july_f != null && `Jul avg ${info.avg_temp_july_f}°F`}
            </span>
          </div>
        )}

        {info.climate_description && (
          <p className="text-muted-foreground italic">{info.climate_description}</p>
        )}

        {info.campus_description && (
          <p className="text-muted-foreground">{info.campus_description}</p>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}

export function SchoolDetailContent({ detail }: { detail: SchoolDetail }) {
  const sentCount = detail.coaches.filter((c) => c.email_sent).length;
  const openedCount = detail.coaches.filter((c) => c.opened).length;
  const repliedCount = detail.coaches.filter((c) => c.replied).length;
  const programs = buildPrograms(detail.coaches);
  const { info } = detail;

  // Derive program-level facts from coaches (consistent per school)
  const firstCoach = detail.coaches[0];
  const conference = firstCoach?.conference ?? null;
  const itaRank = firstCoach?.ita_team_ranking ?? null;
  const hasScholarships = detail.coaches.some((c) => c.scholarships_offered === true);
  const noScholarships = detail.coaches.every((c) => c.scholarships_offered === false);
  const indoorCourts = firstCoach?.indoor_courts ?? null;
  const outdoorCourts = firstCoach?.outdoor_courts ?? null;
  const studentPop = info.student_population;

  return (
    <div className="flex flex-col gap-5">
      {/* Location + links bar */}
      {(info.city || info.state || info.region || info.website || info.setting) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {(info.city || info.state) && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {[info.city, info.state].filter(Boolean).join(", ")}
            </span>
          )}
          {info.region && !info.city && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {info.region}
            </span>
          )}
          {info.region && info.city && <span>{info.region}</span>}
          {info.setting && <span>{info.setting}</span>}
          {info.website && (
            <a
              href={info.website.startsWith("http") ? info.website : `https://${info.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <ExternalLink className="size-3" />
              Website
            </a>
          )}
        </div>
      )}

      {/* Quick-glance recruiting facts */}
      {(conference || itaRank != null || hasScholarships || noScholarships ||
        indoorCourts != null || outdoorCourts != null ||
        studentPop != null || info.acceptance_rate != null || info.total_annual_cost != null) && (
        <div className="flex flex-wrap gap-2">
          {conference && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
              <Trophy className="size-3 text-muted-foreground" />
              {conference}
            </span>
          )}
          {itaRank != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
              <Trophy className="size-3 text-amber-500" />
              ITA #{itaRank}
            </span>
          )}
          {hasScholarships && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
              <GraduationCap className="size-3" />
              Scholarships offered
            </span>
          )}
          {noScholarships && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <GraduationCap className="size-3" />
              No scholarships
            </span>
          )}
          {info.total_annual_cost != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
              <BadgeDollarSign className="size-3 text-muted-foreground" />
              {fmtCurrency(info.total_annual_cost)}/yr total
            </span>
          )}
          {info.acceptance_rate != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
              {fmtPct(info.acceptance_rate)} acceptance
            </span>
          )}
          {studentPop != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
              <Users className="size-3 text-muted-foreground" />
              {fmt(studentPop)} students
            </span>
          )}
          {indoorCourts != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
              <Building2 className="size-3 text-muted-foreground" />
              {indoorCourts} indoor courts
            </span>
          )}
          {outdoorCourts != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
              <Sun className="size-3 text-muted-foreground" />
              {outdoorCourts} outdoor courts
            </span>
          )}
        </div>
      )}

      {/* Engagement summary */}
      <GlassCard>
        <GlassCardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            {/* Primary: coaches count */}
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Coaches on Staff
              </span>
              <span className="mt-1 text-5xl font-bold tracking-tight tabular-nums">
                {detail.coach_count}
              </span>
            </div>

            {/* Divider */}
            <div className="hidden w-px self-stretch bg-border sm:block" />
            <div className="h-px w-full bg-border sm:hidden" />

            {/* Outreach stats */}
            <div className="flex flex-1 flex-col gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Outreach
              </span>
              <div className="flex gap-5">
                {(
                  [
                    { label: "Sent", value: sentCount, active: "text-blue-500" },
                    { label: "Opened", value: openedCount, active: "text-emerald-500" },
                    { label: "Replied", value: repliedCount, active: "text-primary" },
                  ] as const
                ).map(({ label, value, active }) => (
                  <div key={label} className="flex flex-col">
                    <span
                      className={cn(
                        "text-2xl font-semibold tabular-nums",
                        value > 0 ? active : "text-foreground"
                      )}
                    >
                      {value}
                    </span>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>

              {detail.coach_count > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((sentCount / detail.coach_count) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((sentCount / detail.coach_count) * 100)}% of coaches contacted
                  </span>
                </div>
              )}
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      <SchoolProgramTabs programs={programs} />

      <AcademicsCard info={info} />
      <LocationCard info={info} />
    </div>
  );
}
