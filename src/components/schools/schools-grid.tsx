"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, Mail, Search, Star, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFavoriteSchools } from "@/hooks/use-favorite-schools";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { SchoolDetail } from "@/lib/types/school";

const ALL = "all";

function defaultGenderFilter(gender?: string | null): string {
  if (!gender) return ALL;
  const g = gender.toLowerCase();
  if (g.includes("female") || g.includes("woman") || g === "f") return "Women";
  if (g.includes("male") || g.includes("man") || g === "m") return "Men";
  return ALL;
}

type SortKey = "div_asc" | "utr_desc" | "utr_asc" | "coaches_desc" | "name_asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "div_asc",      label: "Division: D1 first" },
  { value: "utr_desc",     label: "UTR: high to low" },
  { value: "utr_asc",      label: "UTR: low to high" },
  { value: "coaches_desc", label: "Most coaches" },
  { value: "name_asc",     label: "School (A–Z)" },
];

const DIV_ORDER: Record<string, number> = { D1: 0, D2: 1, D3: 2, NAIA: 3, JUCO: 4 };

// Color-coded by division type
const DIV_BADGE: Record<string, string> = {
  D1:   "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  D2:   "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  D3:   "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  NAIA: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  JUCO: "bg-muted text-muted-foreground",
};

const AVATAR_COLORS = [
  "#b8863f","#8a6f4d","#c9662d","#7d9159","#a85d43",
  "#7d9159","#c9662d","#a85d43","#9a8b3f","#8a6f4d",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string) {
  const words = name.replace(/[^a-zA-Z\s]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const LC_WORDS = new Set(["a","an","the","and","but","or","nor","for","of","in","on","at","to","by","from","with"]);

function titleCase(str: string) {
  return str
    .split(/\s+/)
    .map((word, i) => {
      if (/^[A-Z]{2,5}$/.test(word)) return word;
      const lower = word.toLowerCase();
      return i === 0 || !LC_WORDS.has(lower)
        ? lower.charAt(0).toUpperCase() + lower.slice(1)
        : lower;
    })
    .join(" ");
}

function sortSchools(schools: SchoolDetail[], sort: SortKey) {
  return [...schools].sort((a, b) => {
    switch (sort) {
      case "div_asc": {
        const da = DIV_ORDER[a.division] ?? 9;
        const db = DIV_ORDER[b.division] ?? 9;
        return da !== db ? da - db : a.school_name.localeCompare(b.school_name);
      }
      case "utr_desc": return (b.avg_utr ?? -Infinity) - (a.avg_utr ?? -Infinity);
      case "utr_asc":  return (a.avg_utr ?? Infinity)  - (b.avg_utr ?? Infinity);
      case "coaches_desc": return b.coach_count - a.coach_count;
      case "name_asc": return a.school_name.localeCompare(b.school_name);
    }
  });
}

function SchoolAvatar({ name }: { name: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white"
      style={{ backgroundColor: avatarColor(name) }}
    >
      {initials(name)}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-border bg-muted/50 py-1 pl-2.5 pr-1.5 text-xs font-medium text-foreground">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

export function SchoolsGrid({
  schools,
  profileGender,
}: {
  schools: SchoolDetail[];
  profileGender?: string | null;
}) {
  const router = useRouter();

  const [search, setSearch]           = useState("");
  const [division, setDivision]       = useState(ALL);
  const [gender, setGender]           = useState(() => defaultGenderFilter(profileGender));
  const [region, setRegion]           = useState(ALL);
  const [minUtr, setMinUtr]           = useState("");
  const [maxUtr, setMaxUtr]           = useState("");
  const [sort, setSort]               = useState<SortKey>("div_asc");
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterVisible, setFilterVisible] = useState(true);
  const barRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const scrollEl = barRef.current?.closest<HTMLElement>(".overflow-y-auto") ?? null;
    if (!scrollEl) return;

    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = scrollEl!.scrollTop;
        if (y - lastScrollY.current > 6 && y > 80) setFilterVisible(false);
        else if (lastScrollY.current - y > 2) setFilterVisible(true);
        lastScrollY.current = y;
        ticking.current = false;
      });
    }

    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, []);

  const { favorites, toggle: toggleFav } = useFavoriteSchools();

  const divisions = useMemo(
    () => [...new Set(schools.map((s) => s.division))].sort(),
    [schools],
  );
  const regions = useMemo(
    () => [...new Set(schools.map((s) => s.info.region).filter(Boolean) as string[])].sort(),
    [schools],
  );

  const minUtrNum = minUtr ? Number(minUtr) : null;
  const maxUtrNum = maxUtr ? Number(maxUtr) : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = schools.filter((s) => {
      if (q && !s.school_name.toLowerCase().includes(q)) return false;
      if (division !== ALL && s.division !== division) return false;
      if (region !== ALL && s.info.region !== region) return false;
      if (gender !== ALL) {
        const ok = s.coaches.some(
          (c) => c.gender != null && c.gender.toLowerCase().includes(gender.toLowerCase()),
        );
        if (!ok) return false;
      }
      if (minUtrNum != null && (s.avg_utr ?? -Infinity) < minUtrNum) return false;
      if (maxUtrNum != null && (s.avg_utr ?? Infinity)  > maxUtrNum) return false;
      if (showFavOnly && !favorites.has(s.school_name)) return false;
      return true;
    });
    return sortSchools(result, sort);
  }, [schools, search, division, region, gender, minUtrNum, maxUtrNum, sort, showFavOnly, favorites]);

  // Active filter chips (excluding search — shown separately in the search bar)
  const activeChips = useMemo(() => {
    const chips: { label: string; clear: () => void }[] = [];
    if (division !== ALL)
      chips.push({ label: division, clear: () => setDivision(ALL) });
    if (gender !== ALL)
      chips.push({ label: gender === "Women" ? "Women's" : "Men's", clear: () => setGender(ALL) });
    if (region !== ALL)
      chips.push({ label: region, clear: () => setRegion(ALL) });
    if (minUtr)
      chips.push({ label: `UTR ≥ ${minUtr}`, clear: () => setMinUtr("") });
    if (maxUtr)
      chips.push({ label: `UTR ≤ ${maxUtr}`, clear: () => setMaxUtr("") });
    if (showFavOnly)
      chips.push({ label: "Shortlisted", clear: () => setShowFavOnly(false) });
    return chips;
  }, [division, gender, region, minUtr, maxUtr, showFavOnly]);

  const activeFilterCount = activeChips.length;
  const favCount = favorites.size;
  const isFiltered = activeFilterCount > 0 || search.trim().length > 0;

  function clearAll() {
    setDivision(ALL);
    setGender(defaultGenderFilter(profileGender));
    setRegion(ALL);
    setMinUtr("");
    setMaxUtr("");
    setShowFavOnly(false);
  }

  // Shared filter controls (rendered in both desktop bar and mobile panel)
  const filterControls = (
    <>
      <Select value={division} onValueChange={(v) => setDivision(v ?? ALL)}>
        <SelectTrigger className="h-9 w-auto min-w-[110px]">
          <span className="truncate text-sm">
            <span className="text-muted-foreground">Division: </span>
            {division === ALL ? "All" : division}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {divisions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={gender} onValueChange={(v) => setGender(v ?? ALL)}>
        <SelectTrigger className="h-9 w-auto min-w-[110px]">
          <span className="truncate text-sm">
            <span className="text-muted-foreground">Program: </span>
            {gender === ALL ? "All" : gender === "Women" ? "Women's" : "Men's"}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          <SelectItem value="Women">Women&apos;s</SelectItem>
          <SelectItem value="Men">Men&apos;s</SelectItem>
        </SelectContent>
      </Select>

      {regions.length > 0 && (
        <Select value={region} onValueChange={(v) => setRegion(v ?? ALL)}>
          <SelectTrigger className="h-9 w-auto min-w-[110px]">
            <span className="truncate text-sm">
              <span className="text-muted-foreground">Region: </span>
              {region === ALL ? "All" : region}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {/* UTR range */}
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          placeholder="UTR min"
          value={minUtr}
          onChange={(e) => setMinUtr(e.target.value)}
          className="h-9 w-[72px] text-sm"
          aria-label="Minimum UTR"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="number"
          placeholder="max"
          value={maxUtr}
          onChange={(e) => setMaxUtr(e.target.value)}
          className="h-9 w-[68px] text-sm"
          aria-label="Maximum UTR"
        />
      </div>

      <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
        <SelectTrigger className="h-9 w-auto min-w-[140px]">
          <span className="truncate text-sm">
            <span className="text-muted-foreground">Sort: </span>
            {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort}
          </span>
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* ── Search bar ─────────────────────────────────────── */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by school name, city, or state…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 pl-9 pr-9 text-sm"
          aria-label="Search schools"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* ── Sticky filter bar ──────────────────────────────── */}
      <div
        ref={barRef}
        className={cn(
          "sticky top-16 z-30 -mx-4 flex flex-col gap-2 px-4 pb-3 pt-1 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          filterVisible ? "translate-y-0" : "-translate-y-[200%]",
        )}
        style={{ background: "var(--panel)" }}
      >

        {/* Top row: mobile toggle + desktop filters + shortlist */}
        <div className="flex items-center gap-2">

          {/* Mobile: Filters toggle button */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "sm:hidden flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
              showFilters || activeFilterCount > 0
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
            aria-expanded={showFilters}
            aria-label="Toggle filters"
          >
            <Filter className="size-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Desktop: filter controls always visible */}
          <div className="hidden flex-1 flex-wrap items-center gap-2 sm:flex">
            {filterControls}
          </div>

          {/* Shortlist toggle — always visible */}
          <button
            onClick={() => setShowFavOnly((v) => !v)}
            aria-pressed={showFavOnly}
            className={cn(
              "ml-auto flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
              showFavOnly
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            <Star className="size-3.5" fill={showFavOnly ? "currentColor" : "none"} />
            <span>Shortlist</span>
            {favCount > 0 && (
              <span className={cn(
                "text-[11px] font-semibold tabular-nums",
                showFavOnly ? "text-primary" : "text-muted-foreground",
              )}>
                {favCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile expanded filter panel */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 sm:hidden">
            {filterControls}
          </div>
        )}

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeChips.map((chip) => (
              <FilterChip key={chip.label} label={chip.label} onRemove={chip.clear} />
            ))}
            <button
              onClick={clearAll}
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          {isFiltered
            ? `Showing ${filtered.length} of ${schools.length} schools`
            : `${filtered.length} schools`}
        </p>
      </div>

      {/* ── School list ────────────────────────────────────── */}
      <ul className="flex flex-col gap-1" role="list" aria-label="Schools">
        {filtered.map((school) => {
          const isFav = favorites.has(school.school_name);
          const hasContacted = school.coaches.some((c) => c.email_sent);
          const name = titleCase(school.school_name);
          const href = `/schools/${encodeURIComponent(school.school_name)}`;
          const location = [school.info.city, school.info.state].filter(Boolean).join(", ");
          const divBadge = DIV_BADGE[school.division] ?? "bg-muted text-muted-foreground";

          const meta = [
            `${school.coach_count} coach${school.coach_count === 1 ? "" : "es"}`,
            school.avg_utr != null ? `UTR ${school.avg_utr.toFixed(1)}` : null,
            location || null,
          ].filter(Boolean).join(" · ");

          return (
            <li key={school.school_name}>
              <div className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/50">
                {/* Avatar + info — wrapped in Link for keyboard nav */}
                <Link
                  href={href}
                  className="flex min-w-0 flex-1 items-center gap-3"
                  aria-label={`${name} — ${school.division}, ${meta}`}
                >
                  <SchoolAvatar name={school.school_name} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{name}</span>
                      <span className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        divBadge,
                      )}>
                        {school.division}
                      </span>
                      {hasContacted && (
                        <span className="hidden text-[11px] text-primary sm:inline">
                          Contacted
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{meta}</p>
                  </div>
                </Link>

                {/* Action buttons — outside the Link */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() =>
                      router.push(
                        `/compose?coaches=${school.coaches.map((c) => encodeURIComponent(c.email)).join(",")}`,
                      )
                    }
                    aria-label={`Email coaches at ${name}`}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors",
                      "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
                      "sm:opacity-0 sm:group-hover:opacity-100",
                    )}
                  >
                    <Mail className="size-3.5" />
                    <span className="hidden sm:inline">Email</span>
                  </button>

                  <button
                    onClick={() => toggleFav(school.school_name)}
                    aria-label={isFav ? `Remove ${name} from shortlist` : `Add ${name} to shortlist`}
                    aria-pressed={isFav}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors",
                      isFav
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : [
                            "border-border text-muted-foreground hover:border-primary/30 hover:text-primary",
                            "sm:opacity-0 sm:group-hover:opacity-100",
                          ],
                    )}
                  >
                    <Star className="size-3.5" fill={isFav ? "currentColor" : "none"} />
                    <span className="hidden sm:inline">{isFav ? "Saved" : "Save"}</span>
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* ── Empty state ────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl" aria-hidden="true">🎾</span>
          <p className="text-base font-semibold">No schools match your filters</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try adjusting your search or removing a filter. You can clear
            individual filters using the chips above.
          </p>
          {isFiltered && (
            <button
              onClick={clearAll}
              className="mt-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
