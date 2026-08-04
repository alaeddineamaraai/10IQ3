"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFavoriteSchools } from "@/hooks/use-favorite-schools";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

const DIV_COLORS: Record<string, string> = {
  D1: "bg-primary text-primary-foreground",
  D2: "bg-muted text-muted-foreground",
  D3: "bg-muted text-muted-foreground",
};

export function SchoolsGrid({ schools, profileGender }: { schools: SchoolDetail[]; profileGender?: string | null }) {
  const router = useRouter();
  const [search, setSearch]         = useState("");
  const [division, setDivision]     = useState(ALL);
  const [gender, setGender]         = useState(() => defaultGenderFilter(profileGender));
  const [region, setRegion]         = useState(ALL);
  const [minUtr, setMinUtr]         = useState("");
  const [maxUtr, setMaxUtr]         = useState("");
  const [sort, setSort]             = useState<SortKey>("div_asc");
  const [showFavOnly, setShowFavOnly] = useState(false);
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
        const hasGender = s.coaches.some((c) =>
          c.gender != null && c.gender.toLowerCase().includes(gender.toLowerCase())
        );
        if (!hasGender) return false;
      }
      if (minUtrNum != null && (s.avg_utr ?? -Infinity) < minUtrNum) return false;
      if (maxUtrNum != null && (s.avg_utr ?? Infinity) > maxUtrNum) return false;
      if (showFavOnly && !favorites.has(s.school_name)) return false;
      return true;
    });
    return sortSchools(result, sort);
  }, [schools, search, division, region, gender, minUtrNum, maxUtrNum, sort, showFavOnly, favorites]);

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
          <Select value={division} onValueChange={(v) => setDivision(v ?? ALL)}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="All divisions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All divisions</SelectItem>
              {divisions.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gender} onValueChange={(v) => setGender(v ?? ALL)}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="All programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All programs</SelectItem>
              <SelectItem value="Women">Women&apos;s</SelectItem>
              <SelectItem value="Men">Men&apos;s</SelectItem>
            </SelectContent>
          </Select>
          {regions.length > 0 && (
            <Select value={region} onValueChange={(v) => setRegion(v ?? ALL)}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All regions</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => setShowFavOnly((v) => !v)}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-smooth",
              showFavOnly
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            <Star className="size-3.5" fill={showFavOnly ? "currentColor" : "none"} />
            Shortlist
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {filtered.length} of {schools.length} schools
        </p>
      </div>

      {/* ── School list ───────────────────────────────────── */}
      <ul className="flex flex-col gap-1.5">
        {filtered.map((school) => {
          const hasContacted = school.coaches.some((c) => c.email_sent);
          const name = titleCase(school.school_name);
          const href = `/schools/${encodeURIComponent(school.school_name)}`;
          const location = [school.info.city, school.info.state].filter(Boolean).join(", ");

          return (
            <li key={school.school_name}>
              <Link
                href={href}
                className="group flex items-center gap-3 rounded-2xl p-3 transition-smooth hover:bg-muted"
              >
                <SchoolAvatar name={school.school_name} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground">{name}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        hasContacted
                          ? DIV_COLORS[school.division] ?? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground"
                      )}
                    >
                      {school.division}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {[
                      `${school.coach_count} coach${school.coach_count === 1 ? "" : "es"}`,
                      school.avg_utr != null ? `Avg UTR ${school.avg_utr.toFixed(1)}` : null,
                      location || null,
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>

                <div
                  className="flex shrink-0 items-center gap-1"
                  onClick={(e) => e.preventDefault()}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(
                        `/compose?coaches=${school.coaches.map((c) => encodeURIComponent(c.email)).join(",")}`
                      );
                    }}
                    className="rounded-full p-1.5 transition-smooth hover:bg-background"
                    aria-label={`Compose email to ${name} coaches`}
                    title="Compose email to this school's coaches"
                  >
                    <Mail className="size-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFav(school.school_name);
                    }}
                    className="rounded-full p-1.5 transition-smooth hover:bg-background"
                    aria-label={favorites.has(school.school_name) ? "Remove from shortlist" : "Add to shortlist"}
                    title={favorites.has(school.school_name) ? "Remove from shortlist" : "Save to shortlist"}
                  >
                    <Star
                      className="size-4"
                      fill={favorites.has(school.school_name) ? "var(--chart-4)" : "none"}
                      stroke={favorites.has(school.school_name) ? "var(--chart-4)" : "currentColor"}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No schools match your filters.
        </p>
      )}
    </div>
  );
}
