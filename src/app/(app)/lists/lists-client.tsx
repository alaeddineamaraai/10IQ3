"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, List, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard, GlassCardContent } from "@/components/glass-card";

type CoachList = { id: string; name: string; created_at: string; member_count: number };

export function ListsClient({ initialLists }: { initialLists: CoachList[] }) {
  const [lists, setLists] = useState<CoachList[]>(initialLists);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (data.list) {
      setLists((prev) => [data.list, ...prev]);
      setNewName("");
      setCreating(false);
    }
    setSaving(false);
  }

  async function deleteList(id: string) {
    await fetch(`/api/lists/${id}`, { method: "DELETE" });
    setLists((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Create new list */}
      {creating ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            placeholder="List name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") setCreating(false); }}
            className="flex-1"
          />
          <Button onClick={create} disabled={!newName.trim() || saving} size="sm">
            {saving ? "Saving…" : "Create"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-fit" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          New list
        </Button>
      )}

      {lists.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
              <List className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No lists yet</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Create a list to group coaches together, then compose to the whole list at once.
            </p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-2">
          {lists.map((list) => (
            <div key={list.id} className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <List className="size-4" />
              </div>
              <Link href={`/lists/${list.id}`} className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{list.name}</span>
                <span className="text-xs text-muted-foreground">
                  {list.member_count} coach{list.member_count === 1 ? "" : "es"}
                </span>
              </Link>
              <Link
                href={`/compose?list=${list.id}`}
                className="hidden shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary group-hover:flex"
              >
                Compose to list
              </Link>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              <button
                onClick={() => deleteList(list.id)}
                className="hidden shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive group-hover:block"
                aria-label="Delete list"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
