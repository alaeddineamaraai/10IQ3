"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlanUsageSummary } from "@/components/billing/plan-usage-summary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";
import {
  REGIONS,
  clampToRange,
  rangeHint,
  type AthleteNumericField,
} from "@/lib/athlete-ranges";
import type { AthleteProfile, OnboardingData } from "@/lib/types/profile";

const GENDERS = ["Male", "Female"];
const STYLES = ["Baseliner", "Aggressive baseliner", "Serve and volley", "All-court"];
const DIVISIONS = ["D1", "D2", "D3", "NAIA", "JUCO"];

const isSampleMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

type FormState = OnboardingData;

function toFormState(profile: AthleteProfile): FormState {
  return {
    utr: profile.utr,
    grad_year: profile.grad_year,
    gpa: profile.gpa,
    rank: profile.rank,
    wtn: profile.wtn,
    gender: profile.gender,
    school: profile.school,
    academy: profile.academy,
    location: profile.location,
    singles_record: profile.singles_record,
    doubles_record: profile.doubles_record,
    style: profile.style,
    target_div: profile.target_div,
    region: profile.region,
    video_link: profile.video_link,
    utr_sports_link: profile.utr_sports_link,
    ai_notes: profile.ai_notes,
  };
}

export function ProfileForm({ profile }: { profile: AthleteProfile }) {
  const [form, setForm] = useState<FormState>(toFormState(profile));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  // Same behavior as onboarding: type freely, snap back into the real-world
  // range once the field loses focus.
  const clampNum = (key: AthleteNumericField) => () =>
    setForm((prev) => {
      const value = prev[key];
      if (value == null) return prev;
      const clamped = clampToRange(key, value);
      return clamped === value ? prev : { ...prev, [key]: clamped };
    });

  async function handleSave() {
    setSaving(true);
    setError(null);

    if (isSampleMode) {
      await new Promise((r) => setTimeout(r, 400));
      setSaving(false);
      setSaved(true);
      return;
    }

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Couldn't save your profile. Try again.");
      return;
    }

    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Account</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{profile.email}</span>
            </div>
            <Badge variant="secondary" className="capitalize">
              {profile.plan}
            </Badge>
          </div>
          <PlanUsageSummary profile={profile} />
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Athlete profile</GlassCardTitle>
          <GlassCardDescription>
            {isSampleMode ? "Sample data — changes aren't persisted." : "Used to personalize your recruiting emails."}
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Grad year" hint={rangeHint("grad_year")}>
              <Input
                type="number"
                value={form.grad_year ?? ""}
                onChange={(e) => update("grad_year", Number(e.target.value) || null)}
                onBlur={clampNum("grad_year")}
              />
            </Field>
            <Field label="GPA" hint={rangeHint("gpa")}>
              <Input
                type="number"
                step="0.01"
                value={form.gpa ?? ""}
                onChange={(e) => update("gpa", Number(e.target.value) || null)}
                onBlur={clampNum("gpa")}
              />
            </Field>
            <Field label="UTR" hint={rangeHint("utr")}>
              <Input
                type="number"
                step="0.01"
                value={form.utr ?? ""}
                onChange={(e) => update("utr", Number(e.target.value) || null)}
                onBlur={clampNum("utr")}
              />
            </Field>
            <Field label="WTN" hint={rangeHint("wtn")}>
              <Input
                type="number"
                step="0.01"
                value={form.wtn ?? ""}
                onChange={(e) => update("wtn", Number(e.target.value) || null)}
                onBlur={clampNum("wtn")}
              />
            </Field>
            <Field label="National rank" hint={rangeHint("rank")}>
              <Input
                type="number"
                value={form.rank ?? ""}
                onChange={(e) => update("rank", Number(e.target.value) || null)}
                onBlur={clampNum("rank")}
              />
            </Field>
            <Field label="Gender">
              <Select value={form.gender ?? ""} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Playing style">
              <Select value={form.style ?? ""} onValueChange={(v) => update("style", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Target division">
              <Select value={form.target_div ?? ""} onValueChange={(v) => update("target_div", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Current school" className="col-span-2">
              <Input value={form.school ?? ""} onChange={(e) => update("school", e.target.value)} />
            </Field>
            <Field label="Academy">
              <Input value={form.academy ?? ""} onChange={(e) => update("academy", e.target.value)} />
            </Field>
            <Field label="Location">
              <Input
                placeholder="City, State"
                value={form.location ?? ""}
                onChange={(e) => update("location", e.target.value)}
              />
            </Field>
            <Field label="Singles record">
              <Input
                value={form.singles_record ?? ""}
                onChange={(e) => update("singles_record", e.target.value)}
              />
            </Field>
            <Field label="Doubles record">
              <Input
                value={form.doubles_record ?? ""}
                onChange={(e) => update("doubles_record", e.target.value)}
              />
            </Field>
            <Field label="Target region">
              <Select value={form.region ?? ""} onValueChange={(v) => update("region", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="UTR Sports profile link" className="col-span-2">
              <Input
                type="url"
                placeholder="https://app.utrsports.net/profiles/..."
                value={form.utr_sports_link ?? ""}
                onChange={(e) => update("utr_sports_link", e.target.value)}
              />
            </Field>
            <Field label="Highlight video link" className="col-span-2">
              <Input
                type="url"
                value={form.video_link ?? ""}
                onChange={(e) => update("video_link", e.target.value)}
              />
            </Field>
            <Field label="AI notes" className="col-span-2">
              <textarea
                rows={4}
                placeholder="Anything the AI should always include — tone preference, scholarship need, injury history, languages…"
                value={form.ai_notes ?? ""}
                onChange={(e) => update("ai_notes", e.target.value)}
                className="w-full resize-none rounded-xl border border-border bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </Field>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </GlassCardContent>
        <GlassCardFooter className="flex items-center justify-end gap-3 bg-transparent">
          {saved && <span className="text-sm text-muted-foreground">Saved</span>}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </GlassCardFooter>
      </GlassCard>
    </div>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
