"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { THEMES, applyTheme } from "@/lib/themes";
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
import { REGIONS, clampToRange, rangeHint } from "@/lib/athlete-ranges";
import type { OnboardingData } from "@/lib/types/profile";

const TOTAL_STEPS = 4;

// Named steps chunk the form into meaningful groups and tell users
// what's coming, not just how far along they are.
const STEP_META = [
  { title: "About you", description: "The basics — who you are on paper." },
  { title: "Your game", description: "How and where you play." },
  { title: "Your targets", description: "Where you want to end up." },
  { title: "AI instructions", description: "Tell the AI anything it should always include." },
] as const;

const GENDERS = ["Male", "Female"];
const STYLES = ["Baseliner", "Aggressive baseliner", "Serve and volley", "All-court"];
const DIVISIONS = ["D1", "D2", "D3", "NAIA", "JUCO"];

type FormState = Partial<OnboardingData>;

type NumericField = "grad_year" | "gpa" | "utr" | "wtn" | "rank";

/**
 * Postel's Law: accept whatever the athlete types — "13,5", " 9.5 ",
 * "UTR 11" — and quietly extract the number. Returns null when there's
 * no number to be found.
 */
function parseLooseNumber(raw: string): number | null {
  const normalized = raw.replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
  const match = normalized.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const value = parseFloat(match[0]);
  return Number.isFinite(value) ? value : null;
}

function update<K extends keyof FormState>(
  setForm: React.Dispatch<React.SetStateAction<FormState>>,
  key: K
) {
  return (value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
}

export function OnboardingForm() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => setThemeMounted(true), []);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({});
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  // Numeric fields are kept as raw strings while typing so intermediate
  // states like "13," or "3." never get eaten; parsed loosely on submit.
  const [nums, setNums] = useState<Record<NumericField, string>>({
    grad_year: "",
    gpa: "",
    utr: "",
    wtn: "",
    rank: "",
  });
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setNum = (key: NumericField) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setNums((prev) => ({ ...prev, [key]: e.target.value }));

  // Clamp out-of-range values on blur rather than while typing — the
  // athlete can still type freely (e.g. backspacing through "16" to type
  // "9.5"), but a stray "99" UTR or "2.5" grad year snaps back into a
  // sane range once they move on.
  const clampNum = (key: NumericField) => () =>
    setNums((prev) => {
      const parsed = parseLooseNumber(prev[key]);
      if (parsed == null) return prev;
      const clamped = clampToRange(key, parsed);
      return clamped === parsed ? prev : { ...prev, [key]: String(clamped) };
    });

  async function handleFinish() {
    setPending(true);
    setError(null);

    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || null;
    // Blur-time clamping already keeps these in range under normal use, but
    // clamp again here as a safety net (e.g. a field never blurred before Finish).
    const clampField = (key: NumericField) => {
      const parsed = parseLooseNumber(nums[key]);
      return parsed == null ? null : clampToRange(key, parsed);
    };
    const parsedNums = {
      grad_year: clampField("grad_year"),
      gpa: clampField("gpa"),
      utr: clampField("utr"),
      wtn: clampField("wtn"),
      rank: clampField("rank"),
    };

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ...parsedNums, name, profile_complete: true }),
    });

    setPending(false);

    if (!res.ok) {
      setError("Couldn't save your profile. Try again.");
      return;
    }

    // Peak-end: land the finish with a beat of celebration before the redirect
    setDone(true);
    setTimeout(() => router.push("/welcome"), 1400);
  }

  if (done) {
    return (
      <GlassCard strong className="animate-in fade-in-0 zoom-in-95 w-full max-w-lg duration-300">
        <GlassCardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <svg className="size-6 text-primary" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <GlassCardTitle className="text-xl">Profile saved</GlassCardTitle>
          <p className="text-sm text-muted-foreground">
            Setting up your quick start guide…
          </p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  if (step === 0) {
    return (
      <div className="flex w-full max-w-lg flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Pick your look</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a theme to start — you can always change it later in Settings.
          </p>
        </div>

        <div className="grid w-full grid-cols-4 gap-3">
          {THEMES.map((t) => {
            const isActive = themeMounted && resolvedTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTheme(setTheme, t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200",
                  isActive
                    ? "border-foreground/30 bg-[var(--glass-bg-strong)] shadow-md"
                    : "border-transparent bg-[var(--glass-bg)] hover:border-border hover:bg-[var(--glass-bg-strong)]"
                )}
              >
                <div
                  className="aspect-video w-full rounded-lg border border-black/10"
                  style={{ backgroundColor: t.bg }}
                />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>

        <Button className="w-full" onClick={() => setStep(1)}>
          Get started
        </Button>
      </div>
    );
  }

  return (
    <GlassCard strong className="w-full max-w-lg">
      <GlassCardHeader>
        <GlassCardTitle className="text-xl">
          {STEP_META[step - 1].title}
        </GlassCardTitle>
        <GlassCardDescription>
          Step {step} of {TOTAL_STEPS} — {STEP_META[step - 1].description}
        </GlassCardDescription>
        <Progress value={(step / TOTAL_STEPS) * 100} className="mt-2" />
      </GlassCardHeader>

      <GlassCardContent className="flex flex-col gap-4">
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name">
              <Input
                placeholder="Alex"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Field>
            <Field label="Last name">
              <Input
                placeholder="Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Field>
            <Field label="Grad year" hint={rangeHint("grad_year")}>
              <Input
                inputMode="numeric"
                placeholder="2027"
                value={nums.grad_year}
                onChange={setNum("grad_year")}
                onBlur={clampNum("grad_year")}
              />
            </Field>
            <Field label="GPA" hint={rangeHint("gpa")}>
              <Input
                inputMode="decimal"
                placeholder="3.8"
                value={nums.gpa}
                onChange={setNum("gpa")}
                onBlur={clampNum("gpa")}
              />
            </Field>
            <Field label="UTR" hint={rangeHint("utr")}>
              <Input
                inputMode="decimal"
                placeholder="9.5"
                value={nums.utr}
                onChange={setNum("utr")}
                onBlur={clampNum("utr")}
              />
            </Field>
            <Field label="WTN" hint={rangeHint("wtn")}>
              <Input
                inputMode="decimal"
                placeholder="12.0"
                value={nums.wtn}
                onChange={setNum("wtn")}
                onBlur={clampNum("wtn")}
              />
            </Field>
            <Field label="National rank" hint={rangeHint("rank")}>
              <Input
                inputMode="numeric"
                placeholder="150"
                value={nums.rank}
                onChange={setNum("rank")}
                onBlur={clampNum("rank")}
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Gender">
              <Select
                value={form.gender ?? ""}
                onValueChange={(v) => update(setForm, "gender")(v as string)}
              >
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
              <Select
                value={form.style ?? ""}
                onValueChange={(v) => update(setForm, "style")(v as string)}
              >
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
            <Field label="Current school" className="col-span-2">
              <Input
                value={form.school ?? ""}
                onChange={(e) => update(setForm, "school")(e.target.value)}
              />
            </Field>
            <Field label="Academy">
              <Input
                value={form.academy ?? ""}
                onChange={(e) => update(setForm, "academy")(e.target.value)}
              />
            </Field>
            <Field label="Location">
              <Input
                placeholder="City, State"
                value={form.location ?? ""}
                onChange={(e) => update(setForm, "location")(e.target.value)}
              />
            </Field>
            <Field label="Singles record">
              <Input
                placeholder="20-5"
                value={form.singles_record ?? ""}
                onChange={(e) => update(setForm, "singles_record")(e.target.value)}
              />
            </Field>
            <Field label="Doubles record">
              <Input
                placeholder="15-8"
                value={form.doubles_record ?? ""}
                onChange={(e) => update(setForm, "doubles_record")(e.target.value)}
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Target division">
              <Select
                value={form.target_div ?? ""}
                onValueChange={(v) => update(setForm, "target_div")(v as string)}
              >
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
            <Field label="Target region">
              <Select
                value={form.region ?? ""}
                onValueChange={(v) => update(setForm, "region")(v as string)}
              >
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
                onChange={(e) => update(setForm, "utr_sports_link")(e.target.value)}
              />
            </Field>
            <Field label="Highlight video link" className="col-span-2">
              <Input
                type="url"
                placeholder="https://youtube.com/..."
                value={form.video_link ?? ""}
                onChange={(e) => update(setForm, "video_link")(e.target.value)}
              />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              The AI reads these notes before writing every email — use them for anything
              consistent about you: injury history, preferred divisions, scholarship need, tone preferences, etc.
            </p>
            <textarea
              rows={7}
              placeholder={`Examples:\n• I prefer warm, conversational tone\n• I had a shoulder injury in 2023, fully recovered\n• I'm specifically looking for full scholarship opportunities\n• My family is from Tunisia — I speak French and Arabic`}
              value={form.ai_notes ?? ""}
              onChange={(e) => update(setForm, "ai_notes")(e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              You can always update this later in Settings → Profile.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </GlassCardContent>

      <GlassCardFooter className="flex justify-between bg-transparent">
        <Button
          variant="ghost"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          Back
        </Button>
        {step < TOTAL_STEPS ? (
          <Button onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={pending}>
            {pending ? "Saving…" : "Finish"}
          </Button>
        )}
      </GlassCardFooter>
    </GlassCard>
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
