"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GraduationCap, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { School } from "@/lib/types/school";

const ALL = "all";

type SortKey = "utr_desc" | "utr_asc" | "coaches_desc" | "name_asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "utr_desc", label: "UTR: high to low" },
  { value: "utr_asc", label: "UTR: low to high" },
  { value: "coaches_desc", label: "Most coaches" },
  { value: "name_asc", label: "School (A–Z)" },
];

function sortSchools(schools: School[], sort: SortKey) {
  const withFallback = (v: number | null, dir: 1 | -1) =>
    v ?? (dir === 1 ? -Infinity : Infinity);

  return [...schools].sort((a, b) => {
    switch (sort) {
      case "utr_desc":
        return withFallback(b.avg_utr, -1) - withFallback(a.avg_utr, -1);
      case "utr_asc":
        return withFallback(a.avg_utr, 1) - withFallback(b.avg_utr, 1);
      case "coaches_desc":
        return b.coach_count - a.coach_count;
      case "name_asc":
        return a.school_name.localeCompare(b.school_name);
    }
  });
}

export function SchoolsGrid({ schools }: { schools: School[] }) {
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState(ALL);
  const [minUtr, setMinUtr] = useState("");
  const [maxUtr, setMaxUtr] = useState("");
  const [sort, setSort] = useState<SortKey>("utr_desc");

  const divisions = useMemo(
    () => [...new Set(schools.map((s) => s.division))].sort(),
    [schools]
  );

  const minUtrNum = minUtr ? Number(minUtr) : null;
  const maxUtrNum = maxUtr ? Number(maxUtr) : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const result = schools.filter((school) => {
      if (q && !school.school_name.toLowerCase().includes(q)) return false;
      if (division !== ALL && school.division !== division) return false;
      if (minUtrNum != null && (school.avg_utr ?? -Infinity) < minUtrNum) return false;
      if (maxUtrNum != null && (school.avg_utr ?? Infinity) > maxUtrNum) return false;
      return true;
    });

    return sortSchools(result, sort);
  }, [schools, search, division, minUtrNum, maxUtrNum, sort]);

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (search.trim()) {
      chips.push({ key: "search", label: `"${search.trim()}"`, onClear: () => setSearch("") });
    }
    if (division !== ALL) {
      chips.push({ key: "division", label: division, onClear: () => setDivision(ALL) });
    }
    if (minUtr) chips.push({ key: "minUtr", label: `UTR ≥ ${minUtr}`, onClear: () => setMinUtr("") });
    if (maxUtr) chips.push({ key: "maxUtr", label: `UTR ≤ ${maxUtr}`, onClear: () => setMaxUtr("") });
    return chips;
  }, [search, division, minUtr, maxUtr]);

  function clearAllFilters() {
    setSearch("");
    setDivision(ALL);
    setMinUtr("");
    setMaxUtr("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Input
          placeholder="Search school…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="col-span-2 sm:col-span-1 lg:col-span-2"
        />
        <Select
          items={{ [ALL]: "All divisions", ...Object.fromEntries(divisions.map((d) => [d, d])) }}
          value={division}
          onValueChange={(v) => setDivision(v ?? ALL)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Division" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All divisions</SelectItem>
            {divisions.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder="Min UTR"
          value={minUtr}
          onChange={(e) => setMinUtr(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max UTR"
          value={maxUtr}
          onChange={(e) => setMaxUtr(e.target.value)}
        />
        <Select
          items={Object.fromEntries(SORT_OPTIONS.map((s) => [s.value, s.label]))}
          value={sort}
          onValueChange={(v) => setSort((v as SortKey) ?? "utr_desc")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.onClear}
              className="flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-smooth hover:text-foreground"
            >
              {chip.label}
              <X className="size-3" />
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {filtered.length} school{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length > 0 && (
        <ul className="flex flex-col gap-2">
          {filtered.map((school) => (
            <li key={school.school_name}>
              <Link
                href={`/schools/${encodeURIComponent(school.school_name)}`}
                className="transition-smooth flex items-center justify-between gap-4 rounded-2xl p-4 hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <GraduationCap className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{school.school_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {school.coach_count} coach{school.coach_count === 1 ? "" : "es"}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  {school.division}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {filtered.length === 0 && (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No schools match these filters.
        </div>
      )}
    </div>
  );
}
