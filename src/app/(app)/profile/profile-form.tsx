"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import type { AthleteProfile, OnboardingData } from "@/lib/types/profile";

const GENDERS = ["Male", "Female"];
const STYLES = ["Baseliner", "Aggressive baseliner", "Serve and volley", "All-court"];
const DIVISIONS = ["D1", "D2", "D3", "NAIA", "JUCO"];
const FREE_PLAN_EMAIL_LIMIT = 5;

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

  const emailsRemaining = Math.max(FREE_PLAN_EMAIL_LIMIT - profile.emails_used, 0);

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
          {profile.plan === "free" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">Free emails used</span>
                <span className="text-muted-foreground">
                  {profile.emails_used} / {FREE_PLAN_EMAIL_LIMIT}
                </span>
              </div>
              <Progress value={(profile.emails_used / FREE_PLAN_EMAIL_LIMIT) * 100} />
              {emailsRemaining === 0 && (
                <span className="text-xs text-destructive">
                  No free emails left — upgrade to send more.
                </span>
              )}
            </div>
          )}
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
            <Field label="Grad year">
              <Input
                type="number"
                value={form.grad_year ?? ""}
                onChange={(e) => update("grad_year", Number(e.target.value) || null)}
              />
            </Field>
            <Field label="GPA">
              <Input
                type="number"
                step="0.01"
                value={form.gpa ?? ""}
                onChange={(e) => update("gpa", Number(e.target.value) || null)}
              />
            </Field>
            <Field label="UTR">
              <Input
                type="number"
                step="0.01"
                value={form.utr ?? ""}
                onChange={(e) => update("utr", Number(e.target.value) || null)}
              />
            </Field>
            <Field label="WTN">
              <Input
                type="number"
                step="0.01"
                value={form.wtn ?? ""}
                onChange={(e) => update("wtn", Number(e.target.value) || null)}
              />
            </Field>
            <Field label="National rank">
              <Input
                type="number"
                value={form.rank ?? ""}
                onChange={(e) => update("rank", Number(e.target.value) || null)}
              />
            </Field>
            <Field label="Gender">
              <Select value={form.gender ?? ""} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger>
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
                <SelectTrigger>
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
                <SelectTrigger>
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
              <Input value={form.region ?? ""} onChange={(e) => update("region", e.target.value)} />
            </Field>
            <Field label="Highlight video link" className="col-span-2">
              <Input
                type="url"
                value={form.video_link ?? ""}
                onChange={(e) => update("video_link", e.target.value)}
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
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
