"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
import type { OnboardingData } from "@/lib/types/profile";

const TOTAL_STEPS = 3;

const GENDERS = ["Male", "Female"];
const STYLES = ["Baseliner", "Aggressive baseliner", "Serve and volley", "All-court"];
const DIVISIONS = ["D1", "D2", "D3", "NAIA", "JUCO"];

type FormState = Partial<OnboardingData>;

function update<K extends keyof FormState>(
  setForm: React.Dispatch<React.SetStateAction<FormState>>,
  key: K
) {
  return (value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
}

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish() {
    setPending(true);
    setError(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, profile_complete: true }),
    });

    setPending(false);

    if (!res.ok) {
      setError("Couldn't save your profile. Try again.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <GlassCard strong className="w-full max-w-lg">
      <GlassCardHeader>
        <GlassCardTitle className="text-xl">
          Tell us about your game
        </GlassCardTitle>
        <GlassCardDescription>Step {step} of {TOTAL_STEPS}</GlassCardDescription>
        <Progress value={(step / TOTAL_STEPS) * 100} className="mt-2" />
      </GlassCardHeader>

      <GlassCardContent className="flex flex-col gap-4">
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Grad year">
              <Input
                type="number"
                placeholder="2027"
                value={form.grad_year ?? ""}
                onChange={(e) => update(setForm, "grad_year")(Number(e.target.value) || null)}
              />
            </Field>
            <Field label="GPA">
              <Input
                type="number"
                step="0.01"
                placeholder="3.8"
                value={form.gpa ?? ""}
                onChange={(e) => update(setForm, "gpa")(Number(e.target.value) || null)}
              />
            </Field>
            <Field label="UTR">
              <Input
                type="number"
                step="0.01"
                placeholder="9.5"
                value={form.utr ?? ""}
                onChange={(e) => update(setForm, "utr")(Number(e.target.value) || null)}
              />
            </Field>
            <Field label="WTN">
              <Input
                type="number"
                step="0.01"
                placeholder="12.0"
                value={form.wtn ?? ""}
                onChange={(e) => update(setForm, "wtn")(Number(e.target.value) || null)}
              />
            </Field>
            <Field label="National rank">
              <Input
                type="number"
                placeholder="150"
                value={form.rank ?? ""}
                onChange={(e) => update(setForm, "rank")(Number(e.target.value) || null)}
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
              <Select
                value={form.style ?? ""}
                onValueChange={(v) => update(setForm, "style")(v as string)}
              >
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
            <Field label="Target region">
              <Input
                placeholder="Northeast"
                value={form.region ?? ""}
                onChange={(e) => update(setForm, "region")(e.target.value)}
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
