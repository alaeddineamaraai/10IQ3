import Link from "next/link";
import { Mail } from "lucide-react";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/glass-card";

export type RecommendedCoach = {
  email: string;
  coach_name: string;
  school_name: string;
  division: string | null;
};

export function CoachRecommendations({ coaches }: { coaches: RecommendedCoach[] }) {
  if (coaches.length === 0) return null;

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Who to Email Next</GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="p-0">
        <div className="divide-y divide-border/50">
          {coaches.map((coach) => (
            <div key={coach.email} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{coach.coach_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {coach.school_name}
                  {coach.division ? ` · ${coach.division}` : ""}
                </p>
              </div>
              <Link
                href={`/compose?coaches=${encodeURIComponent(coach.email)}`}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Mail className="size-3.5" />
                Contact
              </Link>
            </div>
          ))}
        </div>
        <div className="border-t border-border/50 px-5 py-3">
          <Link href="/coaches" className="text-xs text-primary hover:underline">
            Browse all coaches →
          </Link>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
