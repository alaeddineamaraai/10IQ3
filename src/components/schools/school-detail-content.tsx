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
import type { SchoolDetail } from "@/lib/types/school";

export function SchoolDetailContent({ detail }: { detail: SchoolDetail }) {
  const sentCount = detail.coaches.filter((c) => c.email_sent).length;
  const openedCount = detail.coaches.filter((c) => c.opened).length;
  const repliedCount = detail.coaches.filter((c) => c.replied).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        <GlassCardContent className="overflow-x-auto">
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
