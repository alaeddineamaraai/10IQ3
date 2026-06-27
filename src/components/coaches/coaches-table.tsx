"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CoachWithOutreach } from "@/lib/types/coach";

type Props = {
  coaches: CoachWithOutreach[];
};

const ALL = "all";

type Status = "all" | "not_contacted" | "sent" | "opened" | "replied";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "all", label: "Any status" },
  { value: "not_contacted", label: "Not contacted" },
  { value: "sent", label: "Sent" },
  { value: "opened", label: "Opened" },
  { value: "replied", label: "Replied" },
];

function coachStatus(coach: CoachWithOutreach): Status {
  if (coach.outreach?.replied) return "replied";
  if (coach.outreach?.opened) return "opened";
  if (coach.outreach?.email_sent) return "sent";
  return "not_contacted";
}

type SortKey =
  | "utr_desc"
  | "utr_asc"
  | "wtn_desc"
  | "wtn_asc"
  | "name_asc"
  | "school_asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "utr_desc", label: "UTR: high to low" },
  { value: "utr_asc", label: "UTR: low to high" },
  { value: "wtn_desc", label: "WTN: high to low" },
  { value: "wtn_asc", label: "WTN: low to high" },
  { value: "name_asc", label: "Coach name (A–Z)" },
  { value: "school_asc", label: "School (A–Z)" },
];

function sortCoaches(coaches: CoachWithOutreach[], sort: SortKey) {
  const withFallback = (v: number | null, dir: 1 | -1) =>
    v ?? (dir === 1 ? -Infinity : Infinity);

  return [...coaches].sort((a, b) => {
    switch (sort) {
      case "utr_desc":
        return withFallback(b.team_utr, -1) - withFallback(a.team_utr, -1);
      case "utr_asc":
        return withFallback(a.team_utr, 1) - withFallback(b.team_utr, 1);
      case "wtn_desc":
        return withFallback(b.team_wtn, -1) - withFallback(a.team_wtn, -1);
      case "wtn_asc":
        return withFallback(a.team_wtn, 1) - withFallback(b.team_wtn, 1);
      case "name_asc":
        return a.coach_name.localeCompare(b.coach_name);
      case "school_asc":
        return a.school_name.localeCompare(b.school_name);
    }
  });
}

export function CoachesTable({ coaches }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState(ALL);
  const [region, setRegion] = useState(ALL);
  const [status, setStatus] = useState<Status>("all");
  const [minUtr, setMinUtr] = useState("");
  const [maxUtr, setMaxUtr] = useState("");
  const [minWtn, setMinWtn] = useState("");
  const [maxWtn, setMaxWtn] = useState("");
  const [sort, setSort] = useState<SortKey>("utr_desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const divisions = useMemo(
    () => [...new Set(coaches.map((c) => c.division))].sort(),
    [coaches]
  );
  const regions = useMemo(
    () => [...new Set(coaches.map((c) => c.region).filter((r): r is string => !!r))].sort(),
    [coaches]
  );

  const minUtrNum = minUtr ? Number(minUtr) : null;
  const maxUtrNum = maxUtr ? Number(maxUtr) : null;
  const minWtnNum = minWtn ? Number(minWtn) : null;
  const maxWtnNum = maxWtn ? Number(maxWtn) : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const result = coaches.filter((coach) => {
      if (q) {
        const haystack = `${coach.coach_name} ${coach.school_name}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (division !== ALL && coach.division !== division) return false;
      if (region !== ALL && coach.region !== region) return false;
      if (status !== "all" && coachStatus(coach) !== status) return false;
      if (minUtrNum != null && (coach.team_utr ?? -Infinity) < minUtrNum) return false;
      if (maxUtrNum != null && (coach.team_utr ?? Infinity) > maxUtrNum) return false;
      if (minWtnNum != null && (coach.team_wtn ?? -Infinity) < minWtnNum) return false;
      if (maxWtnNum != null && (coach.team_wtn ?? Infinity) > maxWtnNum) return false;
      return true;
    });

    return sortCoaches(result, sort);
  }, [
    coaches,
    search,
    division,
    region,
    status,
    minUtrNum,
    maxUtrNum,
    minWtnNum,
    maxWtnNum,
    sort,
  ]);

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (search.trim()) {
      chips.push({ key: "search", label: `"${search.trim()}"`, onClear: () => setSearch("") });
    }
    if (division !== ALL) {
      chips.push({ key: "division", label: division, onClear: () => setDivision(ALL) });
    }
    if (region !== ALL) {
      chips.push({ key: "region", label: region, onClear: () => setRegion(ALL) });
    }
    if (status !== "all") {
      chips.push({
        key: "status",
        label: STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status,
        onClear: () => setStatus("all"),
      });
    }
    if (minUtr) chips.push({ key: "minUtr", label: `UTR ≥ ${minUtr}`, onClear: () => setMinUtr("") });
    if (maxUtr) chips.push({ key: "maxUtr", label: `UTR ≤ ${maxUtr}`, onClear: () => setMaxUtr("") });
    if (minWtn) chips.push({ key: "minWtn", label: `WTN ≥ ${minWtn}`, onClear: () => setMinWtn("") });
    if (maxWtn) chips.push({ key: "maxWtn", label: `WTN ≤ ${maxWtn}`, onClear: () => setMaxWtn("") });
    return chips;
  }, [search, division, region, status, minUtr, maxUtr, minWtn, maxWtn]);

  function clearAllFilters() {
    setSearch("");
    setDivision(ALL);
    setRegion(ALL);
    setStatus("all");
    setMinUtr("");
    setMaxUtr("");
    setMinWtn("");
    setMaxWtn("");
  }

  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.email));
  const someVisibleSelected = filtered.some((c) => selected.has(c.email));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filtered.forEach((c) => next.delete(c.email));
      } else {
        filtered.forEach((c) => next.add(c.email));
      }
      return next;
    });
  }

  function toggleOne(email: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  function handleBulkCompose() {
    router.push(`/compose?coaches=${[...selected].map(encodeURIComponent).join(",")}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Input
          placeholder="Search coach or school…"
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
        <Select
          items={{ [ALL]: "All regions", ...Object.fromEntries(regions.map((r) => [r, r])) }}
          value={region}
          onValueChange={(v) => setRegion(v ?? ALL)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All regions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s.label]))}
          value={status}
          onValueChange={(v) => setStatus((v as Status) ?? "all")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        <Input
          type="number"
          placeholder="Min WTN"
          value={minWtn}
          onChange={(e) => setMinWtn(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max WTN"
          value={maxWtn}
          onChange={(e) => setMaxWtn(e.target.value)}
        />
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

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length} coach{filtered.length === 1 ? "" : "es"}
        </span>
        {selected.size > 0 && (
          <div className="flex items-center gap-3">
            <span>{selected.size} selected</span>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button size="sm" onClick={handleBulkCompose}>
              <Mail className="size-4" />
              Compose
            </Button>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <Checkbox
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected && !allVisibleSelected}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>Coach</TableHead>
            <TableHead>School</TableHead>
            <TableHead>Division</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>UTR</TableHead>
            <TableHead>WTN</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((coach) => (
            <TableRow key={coach.email}>
              <TableCell>
                <Checkbox
                  checked={selected.has(coach.email)}
                  onCheckedChange={() => toggleOne(coach.email)}
                />
              </TableCell>
              <TableCell className="font-medium">{coach.coach_name}</TableCell>
              <TableCell className="text-muted-foreground">{coach.school_name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{coach.division}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{coach.region ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {coach.team_utr?.toFixed(1) ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {coach.team_wtn?.toFixed(1) ?? "—"}
              </TableCell>
              <TableCell>
                {coach.outreach?.replied ? (
                  <Badge>Replied</Badge>
                ) : coach.outreach?.opened ? (
                  <Badge variant="secondary">Opened</Badge>
                ) : coach.outreach?.email_sent ? (
                  <Badge variant="outline">Sent</Badge>
                ) : (
                  <Badge variant="ghost">Not contacted</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filtered.length === 0 && (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No coaches match these filters.
        </div>
      )}
    </div>
  );
}
