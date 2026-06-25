import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SentEmailRow } from "@/lib/types/dashboard";

export function SentEmailsTable({ rows }: { rows: SentEmailRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No emails sent yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Coach</TableHead>
          <TableHead>School</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Sent</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.coach_name}</TableCell>
            <TableCell className="text-muted-foreground">{row.school_name}</TableCell>
            <TableCell className="max-w-64 truncate">{row.subject}</TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(row.sent_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </TableCell>
            <TableCell>
              <div className="flex gap-1.5">
                {row.replied ? (
                  <Badge>Replied</Badge>
                ) : row.opened ? (
                  <Badge variant="secondary">Opened</Badge>
                ) : (
                  <Badge variant="outline">Sent</Badge>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
