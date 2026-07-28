"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Star, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFavoriteSchools } from "@/hooks/use-favorite-schools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExpandableCard, type ExpandableCardItem } from "@/components/ui/expandable-card";
import { SchoolDetailContent } from "@/components/schools/school-detail-content";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SchoolDetail } from "@/lib/types/school";

const ALL = "all";

type SortKey = "div_asc" | "utr_desc" | "utr_asc" | "coaches_desc" | "name_asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "div_asc",      label: "Division: D1 first" },
  { value: "utr_desc",     label: "UTR: high to low" },
  { value: "utr_asc",      label: "UTR: low to high" },
  { value: "coaches_desc", label: "Most coaches" },
  { value: "name_asc",     label: "School (A–Z)" },
];

const DIV_ORDER: Record<string, number> = { D1: 0, D2: 1, D3: 2, NAIA: 3, JUCO: 4 };
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
      // Preserve all-caps abbreviations like UC, UCLA, JUCO
      if (/^[A-Z]{2,5}$/.test(word)) return word;
      const lower = word.toLowerCase();
      return i === 0 || !LC_WORDS.has(lower) ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
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
      case "utr_desc":
        return (b.avg_utr ?? -Infinity) - (a.avg_utr ?? -Infinity);
      case "utr_asc":
        return (a.avg_utr ?? Infinity) - (b.avg_utr ?? Infinity);
      case "coaches_desc":
        return b.coach_count - a.coach_count;
      case "name_asc":
        return a.school_name.localeCompare(b.school_name);
    }
  });
}

function SchoolAvatar({ name }: { name: string }) {
  const color = avatarColor(name);
  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {initials(name)}
    </div>
  );
}

export function SchoolsGrid({ schools }: { schools: SchoolDetail[] }) {
  const router = useRouter();
  const [search, setSearch]         = useState("");
  const [division, setDivision]     = useState(ALL);
  const [minUtr, setMinUtr]         = useState("");
  const [maxUtr, setMaxUtr]         = useState("");
  const [sort, setSort]             = useState<SortKey>("div_asc");
  const [showFavOnly, setShowFavOnly] = useState(false);
  const { favorites, toggle: toggleFav } = useFavoriteSchools();

  const divisions = useMemo(
    () => [...new Set(schools.map((s) => s.division))].sort(),
    [schools],
  );

  const minUtrNum = minUtr ? Number(minUtr) : null;
  const maxUtrNum = maxUtr ? Number(maxUtr) : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = schools.filter((s) => {
      if (q && !s.school_name.toLowerCase().includes(q)) return false;
      if (division !== ALL && s.division !== division) return false;
      if (minUtrNum != null && (s.avg_utr ?? -Infinity) < minUtrNum) return false;
      if (maxUtrNum != null && (s.avg_utr ?? Infinity) > maxUtrNum) return false;
      if (showFavOnly && !favorites.has(s.school_name)) return false;
      return true;
    });
    return sortSchools(result, sort);
  }, [schools, search, division, minUtrNum, maxUtrNum, sort, showFavOnly, favorites]);

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (search.trim()) chips.push({ key: "search", label: `"${search.trim()}"`, onClear: () => setSearch("") });
    if (division !== ALL) chips.push({ key: "division", label: division, onClear: () => setDivision(ALL) });
    if (minUtr) chips.push({ key: "minUtr", label: `UTR ≥ ${minUtr}`, onClear: () => setMinUtr("") });
    if (maxUtr) chips.push({ key: "maxUtr", label: `UTR ≤ ${maxUtr}`, onClear: () => setMaxUtr("") });
    return chips;
  }, [search, division, minUtr, maxUtr]);

  const cardItems: ExpandableCardItem[] = useMemo(
    () =>
      filtered.map((school) => {
        const hasContacted = school.coaches.some((c) => c.email_sent);
        const name = titleCase(school.school_name);
        const utrLabel = school.avg_utr != null ? `Avg UTR ${school.avg_utr.toFixed(1)}` : null;
        const desc = [
          `${school.coach_count} coach${school.coach_count === 1 ? "" : "es"}`,
          utrLabel,
        ].filter(Boolean).join(" · ");

        return {
          id: school.school_name,
          title: name,
          description: desc,
          badge: school.division,
          badgeVariant: hasContacted ? ("solid" as const) : ("outline" as const),
          icon: <SchoolAvatar name={school.school_name} />,
          ctaText: "View coaches →",
          ctaHref: `/schools/${encodeURIComponent(school.school_name)}`,
          action: (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(
                    `/compose?coaches=${school.coaches.map((c) => encodeURIComponent(c.email)).join(",")}`
                  );
                }}
                className="rounded-full p-1.5 transition-smooth hover:bg-muted"
                aria-label={`Compose email to ${name} coaches`}
                title="Compose email to this school's coaches"
              >
                <Mail className="size-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFav(school.school_name);
                }}
                className="rounded-full p-1.5 transition-smooth hover:bg-muted"
                aria-label={favorites.has(school.school_name) ? "Remove from shortlist" : "Add to shortlist"}
                title={favorites.has(school.school_name) ? "Remove from shortlist" : "Save to shortlist"}
              >
                <Star
                  className="size-4"
                  fill={favorites.has(school.school_name) ? "#c9662d" : "none"}
                  stroke={favorites.has(school.school_name) ? "#c9662d" : "currentColor"}
                  strokeWidth={1.5}
                />
              </button>
            </div>
          ),
          content: <SchoolDetailContent detail={school} />,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, favorites],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* ── Sticky filter bar ───────────────────────────────── */}
      <div className="sticky top-16 z-30 -mx-4 px-4 pb-2 pt-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search school…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 min-w-[160px] flex-1"
          />
          <Select
            items={{ [ALL]: "All divisions", ...Object.fromEntries(divisions.map((d) => [d, d])) }}
            value={division}
            onValueChange={(v) => setDivision(v ?? ALL)}
          >
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All divisions</SelectItem>
              {divisions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Min UTR"
            value={minUtr}
            onChange={(e) => setMinUtr(e.target.value)}
            className="h-9 w-24"
          />
          <Input
            type="number"
            placeholder="Max UTR"
            value={maxUtr}
            onChange={(e) => setMaxUtr(e.target.value)}
            className="h-9 w-24"
          />
          <Select
            items={Object.fromEntries(SORT_OPTIONS.map((s) => [s.value, s.label]))}
            value={sort}
            onValueChange={(v) => setSort((v as SortKey) ?? "div_asc")}
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Active filter chips + counters */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {schools.length} schools
          </span>
          {activeFilters.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.onClear}
              className="flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-smooth hover:text-foreground"
            >
              {chip.label} <X className="size-3" />
            </button>
          ))}
          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setSearch(""); setDivision(ALL); setMinUtr(""); setMaxUtr(""); }}>
              Clear all
            </Button>
          )}
          {favorites.size > 0 && (
            <button
              onClick={() => setShowFavOnly((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-smooth",
                showFavOnly
                  ? "border-amber-400/50 bg-amber-400/10 text-amber-500"
                  : "border-border bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <Star className="size-3" fill={showFavOnly ? "#c9662d" : "none"} stroke={showFavOnly ? "#c9662d" : "currentColor"} strokeWidth={1.5} />
              Shortlist ({favorites.size})
            </button>
          )}
        </div>
      </div>

      {/* ── School list ─────────────────────────────────────── */}
      {cardItems.length > 0 ? (
        <ExpandableCard items={cardItems} modalClassName="max-w-2xl" />
      ) : (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No schools match these filters.
        </div>
      )}
    </div>
  );
}
