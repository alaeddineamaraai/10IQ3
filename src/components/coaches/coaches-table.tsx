"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Mail, SlidersHorizontal, Star, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFavoriteSchools } from "@/hooks/use-favorite-schools";
import { DIVISIONS, REGIONS, type CoachSortKey, type CoachStatus } from "@/lib/data/coaches";

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
  initialCoaches: CoachWithOutreach[];
  initialTotal: number;
  isSample: boolean;
};

const ALL = "all";
const PAGE_SIZE = 50;
// Search/number inputs are debounced so every keystroke doesn't fire a
// request — dropdowns/sort/page changes fetch immediately since they're
// discrete, not typed.
const SEARCH_DEBOUNCE_MS = 350;

const STATUS_OPTIONS: { value: CoachStatus; label: string }[] = [
  { value: "all", label: "Any status" },
  { value: "not_contacted", label: "Not contacted" },
  { value: "sent", label: "Sent" },
  { value: "opened", label: "Opened" },
  { value: "replied", label: "Replied" },
];

function coachStatus(coach: CoachWithOutreach): Exclude<CoachStatus, "all"> {
  if (coach.outreach?.replied) return "replied";
  if (coach.outreach?.opened) return "opened";
  if (coach.outreach?.email_sent) return "sent";
  return "not_contacted";
}

const SORT_OPTIONS: { value: CoachSortKey; label: string }[] = [
  { value: "utr_desc", label: "UTR: high to low" },
  { value: "utr_asc", label: "UTR: low to high" },
  { value: "wtn_desc", label: "WTN: high to low" },
  { value: "wtn_asc", label: "WTN: low to high" },
  { value: "name_asc", label: "Coach name (A–Z)" },
  { value: "school_asc", label: "School (A–Z)" },
];

// Sample mode has no server to page against (getSampleCoaches returns a
// small fixed array) — filter/sort/slice it client-side exactly like the
// old implementation did, so the demo experience is unchanged.
function sortSampleCoaches(coaches: CoachWithOutreach[], sort: CoachSortKey) {
  const withFallback = (v: number | null, dir: 1 | -1) => v ?? (dir === 1 ? -Infinity : Infinity);
  return [...coaches].sort((a, b) => {
    switch (sort) {
      case "utr_desc": return withFallback(b.team_utr, -1) - withFallback(a.team_utr, -1);
      case "utr_asc": return withFallback(a.team_utr, 1) - withFallback(b.team_utr, 1);
      case "wtn_desc": return withFallback(b.team_wtn, -1) - withFallback(a.team_wtn, -1);
      case "wtn_asc": return withFallback(a.team_wtn, 1) - withFallback(b.team_wtn, 1);
      case "name_asc": return a.coach_name.localeCompare(b.coach_name);
      case "school_asc": return a.school_name.localeCompare(b.school_name);
    }
  });
}

export function CoachesTable({ initialCoaches, initialTotal, isSample }: Props) {
  const router = useRouter();
  // The topbar search navigates here with ?search=…, so seed from the URL.
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [division, setDivision] = useState(ALL);
  const [region, setRegion] = useState(ALL);
  const [status, setStatus] = useState<CoachStatus>("all");
  const [minUtr, setMinUtr] = useState("");
  const [maxUtr, setMaxUtr] = useState("");
  const [minWtn, setMinWtn] = useState("");
  const [maxWtn, setMaxWtn] = useState("");
  const [sort, setSort] = useState<CoachSortKey>("utr_desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { favorites, toggle: toggleFav } = useFavoriteSchools();

  const [coaches, setCoaches] = useState(initialCoaches);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // The server already gave us page 1 with no filters via SSR — skip
  // re-fetching that exact same request on mount.
  const skippedFirstFetch = useRef(false);
  const requestIdRef = useRef(0);

  function resetToFirstPage() {
    setPage(1);
  }

  useEffect(() => {
    if (isSample) return;

    if (!skippedFirstFetch.current) {
      skippedFirstFetch.current = true;
      return;
    }

    const requestId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setFetchError(null);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sort,
      });
      if (search.trim()) params.set("search", search.trim());
      if (division !== ALL) params.set("division", division);
      if (region !== ALL) params.set("region", region);
      if (status !== "all") params.set("status", status);
      if (minUtr) params.set("minUtr", minUtr);
      if (maxUtr) params.set("maxUtr", maxUtr);
      if (minWtn) params.set("minWtn", minWtn);
      if (maxWtn) params.set("maxWtn", maxWtn);

      try {
        const res = await fetch(`/api/coaches?${params.toString()}`);
        const data = await res.json();

        // A newer request finished first — ignore this stale one.
        if (requestId !== requestIdRef.current) return;

        if (!res.ok) {
          setFetchError(data.error ?? "Couldn't load coaches");
          setLoading(false);
          return;
        }

        setCoaches(data.coaches);
        setTotal(data.total);
      } catch {
        if (requestId === requestIdRef.current) {
          setFetchError("Network error loading coaches");
        }
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [isSample, page, sort, search, division, region, status, minUtr, maxUtr, minWtn, maxWtn]);

  // Searching again from the topbar changes ?search= without remounting this
  // component, so mirror the param back into local state when it moves.
  const urlSearch = searchParams.get("search") ?? "";
  useEffect(() => {
    setSearch(urlSearch);
    setPage(1);
  }, [urlSearch]);

  function updateSearch(v: string) { setSearch(v); resetToFirstPage(); }
  function updateDivision(v: string) { setDivision(v); resetToFirstPage(); }
  function updateRegion(v: string) { setRegion(v); resetToFirstPage(); }
  function updateStatus(v: CoachStatus) { setStatus(v); resetToFirstPage(); }
  function updateMinUtr(v: string) { setMinUtr(v); resetToFirstPage(); }
  function updateMaxUtr(v: string) { setMaxUtr(v); resetToFirstPage(); }
  function updateMinWtn(v: string) { setMinWtn(v); resetToFirstPage(); }
  function updateMaxWtn(v: string) { setMaxWtn(v); resetToFirstPage(); }
  function updateSort(v: CoachSortKey) { setSort(v); resetToFirstPage(); }

  // Sample mode: filter/sort/slice the small fixed array in memory —
  // matches the pre-pagination behavior exactly for the demo experience.
  const sampleFiltered = useMemo(() => {
    if (!isSample) return [];
    const q = search.trim().toLowerCase();
    const minUtrNum = minUtr ? Number(minUtr) : null;
    const maxUtrNum = maxUtr ? Number(maxUtr) : null;
    const minWtnNum = minWtn ? Number(minWtn) : null;
    const maxWtnNum = maxWtn ? Number(maxWtn) : null;

    const result = initialCoaches.filter((coach) => {
      if (q && !`${coach.coach_name} ${coach.school_name}`.toLowerCase().includes(q)) return false;
      if (division !== ALL && coach.division !== division) return false;
      if (region !== ALL && coach.region !== region) return false;
      if (status !== "all" && coachStatus(coach) !== status) return false;
      if (minUtrNum != null && (coach.team_utr ?? -Infinity) < minUtrNum) return false;
      if (maxUtrNum != null && (coach.team_utr ?? Infinity) > maxUtrNum) return false;
      if (minWtnNum != null && (coach.team_wtn ?? -Infinity) < minWtnNum) return false;
      if (maxWtnNum != null && (coach.team_wtn ?? Infinity) > maxWtnNum) return false;
      return true;
    });

    return sortSampleCoaches(result, sort);
  }, [isSample, initialCoaches, search, division, region, status, minUtr, maxUtr, minWtn, maxWtn, sort]);

  const displayedCoaches = isSample
    ? sampleFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : coaches;
  const displayedTotal = isSample ? sampleFiltered.length : total;
  const pageCount = Math.max(1, Math.ceil(displayedTotal / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (search.trim()) {
      chips.push({ key: "search", label: `"${search.trim()}"`, onClear: () => updateSearch("") });
    }
    if (division !== ALL) {
      chips.push({ key: "division", label: division, onClear: () => updateDivision(ALL) });
    }
    if (region !== ALL) {
      chips.push({ key: "region", label: region, onClear: () => updateRegion(ALL) });
    }
    if (status !== "all") {
      chips.push({
        key: "status",
        label: STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status,
        onClear: () => updateStatus("all"),
      });
    }
    if (minUtr) chips.push({ key: "minUtr", label: `UTR ≥ ${minUtr}`, onClear: () => updateMinUtr("") });
    if (maxUtr) chips.push({ key: "maxUtr", label: `UTR ≤ ${maxUtr}`, onClear: () => updateMaxUtr("") });
    if (minWtn) chips.push({ key: "minWtn", label: `WTN ≥ ${minWtn}`, onClear: () => updateMinWtn("") });
    if (maxWtn) chips.push({ key: "maxWtn", label: `WTN ≤ ${maxWtn}`, onClear: () => updateMaxWtn("") });
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setPage(1);
  }

  const allVisibleSelected = displayedCoaches.length > 0 && displayedCoaches.every((c) => selected.has(c.email));
  const someVisibleSelected = displayedCoaches.some((c) => selected.has(c.email));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        displayedCoaches.forEach((c) => next.delete(c.email));
      } else {
        displayedCoaches.forEach((c) => next.add(c.email));
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

  // Progressive disclosure (Hick's Law): only the three filters that cover
  // most sessions stay visible; everything else lives behind "More filters".
  const advancedActiveCount = [
    region !== ALL,
    sort !== "utr_desc",
    minUtr !== "",
    maxUtr !== "",
    minWtn !== "",
    maxWtn !== "",
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Input
          placeholder="Search coach or school…"
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
          className="col-span-2"
        />
        <Select
          items={{ [ALL]: "All divisions", ...Object.fromEntries(DIVISIONS.map((d) => [d, d])) }}
          value={division}
          onValueChange={(v) => updateDivision(v ?? ALL)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Division" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All divisions</SelectItem>
            {DIVISIONS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s.label]))}
          value={status}
          onValueChange={(v) => updateStatus((v as CoachStatus) ?? "all")}
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
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="justify-center gap-1.5"
        >
          <SlidersHorizontal className="size-4" />
          <span>Filters</span>
          {advancedActiveCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
              {advancedActiveCount}
            </span>
          )}
          <ChevronDown
            className={cn("size-3.5 transition-transform duration-200", showAdvanced && "rotate-180")}
          />
        </Button>
      </div>

      {showAdvanced && (
        <div className="animate-in fade-in-0 slide-in-from-top-1 grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 duration-200 sm:grid-cols-3 lg:grid-cols-6">
          <Select
            items={{ [ALL]: "All regions", ...Object.fromEntries(REGIONS.map((r) => [r, r])) }}
            value={region}
            onValueChange={(v) => updateRegion(v ?? ALL)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All regions</SelectItem>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={Object.fromEntries(SORT_OPTIONS.map((s) => [s.value, s.label]))}
            value={sort}
            onValueChange={(v) => updateSort((v as CoachSortKey) ?? "utr_desc")}
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
          <Input
            type="number"
            placeholder="Min UTR"
            value={minUtr}
            onChange={(e) => updateMinUtr(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max UTR"
            value={maxUtr}
            onChange={(e) => updateMaxUtr(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Min WTN"
            value={minWtn}
            onChange={(e) => updateMinWtn(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max WTN"
            value={maxWtn}
            onChange={(e) => updateMaxWtn(e.target.value)}
          />
        </div>
      )}

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
        <span className="flex items-center gap-2">
          {loading && <Loader2 className="size-3.5 animate-spin" />}
          {displayedTotal.toLocaleString()} coach{displayedTotal === 1 ? "" : "es"}
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

      {fetchError && <p className="text-sm text-destructive">{fetchError}</p>}

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
            <TableHead className="hidden sm:table-cell">School</TableHead>
            <TableHead className="hidden sm:table-cell">Division</TableHead>
            <TableHead className="hidden lg:table-cell">Region</TableHead>
            <TableHead className="hidden sm:table-cell">UTR</TableHead>
            <TableHead className="hidden md:table-cell">WTN</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedCoaches.map((coach) => (
            <TableRow
              key={coach.email}
              className="cursor-pointer transition-colors hover:bg-muted/40"
              onClick={() => router.push(`/coaches/${encodeURIComponent(coach.email)}`)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selected.has(coach.email)}
                  onCheckedChange={() => toggleOne(coach.email)}
                />
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {coach.coach_name}
                  <Badge variant="secondary" className="sm:hidden">
                    {coach.division}
                  </Badge>
                </div>
                {/* Below sm the School column is hidden, so surface school
                    and UTR here — keeps status + actions on-screen instead
                    of forcing a horizontal scroll to reach them. */}
                <span className="block max-w-[160px] truncate text-xs font-normal text-muted-foreground sm:hidden">
                  {coach.school_name}
                  {coach.team_utr != null && ` · UTR ${coach.team_utr.toFixed(1)}`}
                </span>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {coach.school_name}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant="secondary">{coach.division}</Badge>
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {coach.region ?? "—"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {coach.team_utr?.toFixed(1) ?? "—"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {coach.team_wtn?.toFixed(1) ?? "—"}
              </TableCell>
              <TableCell>
                {coach.outreach?.replied ? (
                  <span className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium sm:px-2.5 sm:text-xs" style={{ background: "#7d915922", color: "#7d9159" }}>Replied</span>
                ) : coach.outreach?.opened ? (
                  <span className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium sm:px-2.5 sm:text-xs" style={{ background: "#f9731622", color: "#f97316" }}>Opened</span>
                ) : coach.outreach?.email_sent ? (
                  <span className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium sm:px-2.5 sm:text-xs" style={{ background: "#c9662d22", color: "#c9662d" }}>Sent</span>
                ) : (
                  <span className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:px-2.5 sm:text-xs" style={{ background: "var(--muted)" }}>
                    <span className="sm:hidden">New</span>
                    <span className="hidden sm:inline">Not contacted</span>
                  </span>
                )}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/compose?coaches=${encodeURIComponent(coach.email)}`);
                    }}
                    className="rounded-full p-1.5 transition-smooth hover:bg-muted"
                    aria-label={`Compose email to ${coach.coach_name}`}
                    title="Compose email"
                  >
                    <Mail className="size-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFav(coach.school_name);
                    }}
                    className="rounded-full p-1.5 transition-smooth hover:bg-muted"
                    aria-label={
                      favorites.has(coach.school_name) ? "Remove school from shortlist" : "Add school to shortlist"
                    }
                    title={favorites.has(coach.school_name) ? "Remove from shortlist" : "Save school to shortlist"}
                  >
                    <Star
                      className="size-4"
                      fill={favorites.has(coach.school_name) ? "#c9662d" : "none"}
                      stroke={favorites.has(coach.school_name) ? "#c9662d" : "currentColor"}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {displayedTotal > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, displayedTotal)} of {displayedTotal.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="size-4" />
              Prev
            </Button>
            <span className="text-xs">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage === pageCount || loading}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {displayedTotal === 0 && !loading && (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No coaches match these filters.
        </div>
      )}
    </div>
  );
}
