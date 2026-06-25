"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

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

export function CoachesTable({ coaches }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState(ALL);
  const [region, setRegion] = useState(ALL);
  const [minUtr, setMinUtr] = useState("");
  const [maxWtn, setMaxWtn] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const divisions = useMemo(
    () => [...new Set(coaches.map((c) => c.division))].sort(),
    [coaches]
  );
  const regions = useMemo(
    () => [...new Set(coaches.map((c) => c.region).filter((r): r is string => !!r))].sort(),
    [coaches]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const minUtrNum = minUtr ? Number(minUtr) : null;
    const maxWtnNum = maxWtn ? Number(maxWtn) : null;

    return coaches.filter((coach) => {
      if (q) {
        const haystack = `${coach.coach_name} ${coach.school_name}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (division !== ALL && coach.division !== division) return false;
      if (region !== ALL && coach.region !== region) return false;
      if (minUtrNum != null && (coach.team_utr ?? -Infinity) < minUtrNum) return false;
      if (maxWtnNum != null && (coach.team_wtn ?? Infinity) > maxWtnNum) return false;
      return true;
    });
  }, [coaches, search, division, region, minUtr, maxWtn]);

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Input
          placeholder="Search coach or school…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="col-span-2 sm:col-span-1 lg:col-span-2"
        />
        <Select value={division} onValueChange={(v) => setDivision(v ?? ALL)}>
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
        <Select value={region} onValueChange={(v) => setRegion(v ?? ALL)}>
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
        <Input
          type="number"
          placeholder="Min UTR"
          value={minUtr}
          onChange={(e) => setMinUtr(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max WTN"
          value={maxWtn}
          onChange={(e) => setMaxWtn(e.target.value)}
        />
      </div>

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
