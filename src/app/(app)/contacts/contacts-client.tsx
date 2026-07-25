"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SchoolsGrid } from "@/components/schools/schools-grid";
import { CoachesTable } from "@/components/coaches/coaches-table";
import { TourDemoCoach } from "@/components/welcome/tour-demo";
import type { SchoolDetail } from "@/lib/types/school";
import type { CoachWithOutreach } from "@/lib/types/coach";

type Tab = "schools" | "coaches";

type Props = {
  schools: SchoolDetail[];
  coaches: CoachWithOutreach[];
  coachesTotal: number;
  schoolsSample: boolean;
  coachesSample: boolean;
};

export function ContactsClient({ schools, coaches, coachesTotal, schoolsSample, coachesSample }: Props) {
  const [tab, setTab] = useState<Tab>("schools");

  const subtitle =
    tab === "schools"
      ? schoolsSample
        ? "Sample data — showing a preview of the schools directory."
        : `${schools.length} schools with coaches in the database.`
      : coachesSample
        ? "Sample data — showing a preview of the coaches directory."
        : `${coachesTotal.toLocaleString()} coaches in the database.`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <TourDemoCoach />

      {/* Tab slider */}
      <div className="flex w-fit rounded-xl border border-border/50 bg-muted/40 p-1 backdrop-blur-sm">
        {(["schools", "coaches"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-5 py-1.5 text-sm font-medium capitalize transition-all duration-200",
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "schools" ? "Schools" : "Coaches"}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "schools" ? (
        <SchoolsGrid schools={schools} />
      ) : (
        <CoachesTable initialCoaches={coaches} initialTotal={coachesTotal} isSample={coachesSample} />
      )}
    </div>
  );
}
