"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Trash2 } from "lucide-react";
import { GlassCard, GlassCardContent } from "@/components/glass-card";

type Member = {
  id: string;
  coach_email: string;
  added_at: string;
  coach_name: string;
  school_name: string;
  division: string | null;
};

type List = { id: string; name: string; created_at: string };

export function ListDetailClient({
  list,
  initialMembers,
}: {
  list: List;
  initialMembers: Member[];
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);

  async function removeMember(coachEmail: string) {
    await fetch(`/api/lists/${list.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coach_email: coachEmail }),
    });
    setMembers((prev) => prev.filter((m) => m.coach_email !== coachEmail));
  }

  const composeHref =
    members.length > 0
      ? `/compose?coaches=${members.map((m) => encodeURIComponent(m.coach_email)).join(",")}`
      : "/compose";

  return (
    <>
      <div className="flex items-center gap-3">
        <Link href="/lists" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Lists
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{list.name}</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} coach{members.length === 1 ? "" : "es"}
          </p>
        </div>
        {members.length > 0 && (
          <Link
            href={composeHref}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Mail className="size-4" />
            Compose to list
          </Link>
        )}
      </div>

      {members.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium">No coaches in this list yet</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Add coaches from the Coaches or Schools pages using the &quot;Add to list&quot; button.
            </p>
            <Link href="/coaches" className="text-xs font-semibold text-primary hover:underline">
              Browse coaches →
            </Link>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.id} className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.coach_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.school_name}{m.division ? ` · ${m.division}` : ""}
                </p>
              </div>
              <Link
                href={`/compose?coaches=${encodeURIComponent(m.coach_email)}`}
                className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary group-hover:flex"
              >
                <Mail className="size-3" />
                Contact
              </Link>
              <button
                onClick={() => removeMember(m.coach_email)}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Remove from list"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
