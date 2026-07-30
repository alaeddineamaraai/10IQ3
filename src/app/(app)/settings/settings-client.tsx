"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  LogOut,
  Palette,
  Shield,
  Trash2,
  User,
  Pencil,
  Camera,
  BookOpen,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { HowToGuide } from "@/components/guide/how-to-guide";
import { AchievementStory } from "@/components/stories/achievement-story";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPlan } from "@/lib/stripe/plans";
import { isStrongPassword } from "@/lib/password";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { PlanUsageSummary } from "@/components/billing/plan-usage-summary";
import type { AthleteProfile } from "@/lib/types/profile";
import type { AchievementStats } from "@/lib/data/achievements";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";

const isSampleMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

const PROFILE_FIELDS: { key: keyof AthleteProfile; label: string }[] = [
  { key: "grad_year", label: "Grad year" },
  { key: "gpa", label: "GPA" },
  { key: "utr", label: "UTR" },
  { key: "wtn", label: "WTN" },
  { key: "rank", label: "National rank" },
  { key: "gender", label: "Gender" },
  { key: "style", label: "Playing style" },
  { key: "school", label: "Current school" },
  { key: "academy", label: "Academy" },
  { key: "location", label: "Location" },
  { key: "singles_record", label: "Singles record" },
  { key: "doubles_record", label: "Doubles record" },
  { key: "target_div", label: "Target division" },
  { key: "region", label: "Target region" },
  { key: "video_link", label: "Highlight video" },
];

export function SettingsClient({ profile, stats }: { profile: AthleteProfile; stats: AchievementStats }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityPending, setSecurityPending] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [portalPending, setPortalPending] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const currentPlanDef = getPlan(profile.plan);
  const hasBillingAccount = !!profile.stripe_customer_id;

  async function handleSignOut() {
    if (isSampleMode) { router.push("/auth"); return; }
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  async function handlePasswordChange() {
    setSecurityMessage(null);
    if (isSampleMode) {
      setSecurityMessage({ type: "error", text: "Sign in to change your password." });
      return;
    }
    if (!currentPassword) {
      setSecurityMessage({ type: "error", text: "Enter your current password." });
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setSecurityMessage({ type: "error", text: "New password doesn't meet the requirements below." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: "error", text: "Passwords don't match." });
      return;
    }

    setSecurityPending(true);
    const supabase = createSupabaseBrowserClient();

    // Re-authenticate with the current password before allowing the change —
    // updateUser() alone will happily swap the password for anyone holding a
    // live session (e.g. an unattended logged-in browser), so we confirm the
    // account owner actually knows the current password first.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });
    if (reauthError) {
      setSecurityPending(false);
      setSecurityMessage({ type: "error", text: "Current password is incorrect." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSecurityPending(false);
    if (error) { setSecurityMessage({ type: "error", text: error.message }); return; }
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setSecurityMessage({ type: "success", text: "Password updated." });
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    if (isSampleMode) { setDeleteError("Sign in to delete your account."); return; }
    setDeletePending(true);
    const res = await fetch("/api/profile", { method: "DELETE" });
    const data = await res.json();
    setDeletePending(false);
    if (!res.ok) { setDeleteError(data.error ?? "Could not delete account"); return; }
    // Auth session is now gone — redirect to home
    router.push("/");
  }

  async function handleManageBilling() {
    setPortalError(null);
    if (isSampleMode) { setPortalError("Sign in to manage billing."); return; }
    setPortalPending(true);
    const res = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnUrl: window.location.href }),
    });
    const data = await res.json();
    setPortalPending(false);
    if (!res.ok) { setPortalError(data.error ?? "Couldn't open billing portal"); return; }
    window.location.href = data.url;
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Account */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <User className="size-4" /> Account
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {initials(profile.name, profile.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">{profile.name ?? "Your account"}</span>
              <span className="text-sm text-muted-foreground">{profile.email}</span>
              <Badge variant="secondary" className="mt-1 w-fit capitalize">{profile.plan}</Badge>
            </div>
          </div>

          <PlanUsageSummary profile={profile} />

          <Button variant="outline" size="sm" className="w-fit" onClick={handleSignOut} disabled={signingOut}>
            <LogOut className="size-4" />
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </GlassCardContent>
      </GlassCard>

      {/* Appearance */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Palette className="size-4" /> Appearance
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Choose how Netset looks — your preference is saved on this device.
          </p>
          <ThemeToggle variant="grid" />
        </GlassCardContent>
      </GlassCard>

      {/* Help — the walkthrough guide, moved here from the top bar */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <BookOpen className="size-4" /> Help
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            New to Netset? Walk through how to find coaches, send emails, and track replies.
          </p>
          <HowToGuide />
        </GlassCardContent>
      </GlassCard>

      {/* Profile snapshot */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <GlassCardTitle className="flex items-center gap-2">
              <Pencil className="size-4" /> Athlete Profile
            </GlassCardTitle>
            <Link href="/profile" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Edit profile →
            </Link>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Used by the AI to personalize your recruiting emails.
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {PROFILE_FIELDS.map((field) => {
              const value = profile[field.key];
              return (
                <div key={field.key} className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-muted-foreground">{field.label}</span>
                  <span className="truncate text-sm font-medium">
                    {value != null && value !== "" ? String(value) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Security */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Shield className="size-4" /> Security
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Current password</Label>
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>New password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <PasswordRequirements password={newPassword} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Confirm password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
          </div>
          {securityMessage && (
            <p className={securityMessage.type === "error" ? "text-sm text-destructive" : "text-sm text-primary"}>
              {securityMessage.text}
            </p>
          )}
          <Button size="sm" className="w-fit" onClick={handlePasswordChange} disabled={securityPending}>
            {securityPending ? "Updating…" : "Update password"}
          </Button>
        </GlassCardContent>
      </GlassCard>

      {/* Billing */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <CreditCard className="size-4" /> Billing
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current plan</span>
            <Badge variant="secondary">
              {currentPlanDef
                ? `${currentPlanDef.name}${currentPlanDef.priceMonthly > 0 ? ` — $${currentPlanDef.priceMonthly}/mo` : ""}`
                : profile.plan}
            </Badge>
          </div>

          {hasBillingAccount ? (
            <Button size="sm" className="w-fit" onClick={handleManageBilling} disabled={portalPending}>
              <CreditCard className="size-4" />
              {portalPending ? "Opening…" : "Manage billing"}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                No billing account yet — upgrade to unlock unlimited emails and the AI Advisor.
              </p>
              <Link href="/paywall" className={buttonVariants({ size: "sm", className: "w-fit" })}>
                View plans →
              </Link>
            </div>
          )}

          {portalError && <p className="text-sm text-destructive">{portalError}</p>}

          <p className="text-xs text-muted-foreground">
            Billing is handled by Stripe — update your card, view invoices, or cancel anytime.
          </p>
        </GlassCardContent>
      </GlassCard>

      {/* Achievement Stories */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Camera className="size-4" /> Achievement Stories
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Create aesthetic story cards for your recruiting wins — coach replies, milestones, emails sent. Save the image and share it on Instagram, TikTok, or anywhere you want.
          </p>
          <AchievementStory
            profile={profile}
            stats={stats}
            trigger={
              <div
                className="flex w-fit cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-smooth hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #3D2010, #9E7048)" }}
              >
                <Camera className="size-4" />
                Create achievement story
              </div>
            }
          />
          <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/20 p-4">
            <p className="text-xs font-semibold text-muted-foreground">Direct Instagram posting</p>
            <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2"><span className="mt-0.5 text-muted-foreground/40">○</span> Instagram Business or Creator account required</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-muted-foreground/40">○</span> Facebook App approval in progress</li>
            </ul>
            <Button
              size="sm"
              className="w-fit"
              disabled
              style={{ background: "linear-gradient(135deg, #f09433, #e6683c, #bc1888)", color: "white", border: "none", opacity: 0.6 }}
            >
              <Camera className="size-4" />
              Connect Instagram
              <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">Coming soon</span>
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Danger zone */}
      <GlassCard className="border-destructive/30">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-4" /> Delete Account
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Permanently deletes your account, profile, and all outreach data. This action cannot be undone.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="max-w-xs border-destructive/40"
            />
          </div>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <Button
            variant="destructive"
            size="sm"
            className="w-fit"
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== "DELETE" || deletePending}
          >
            <Trash2 className="size-4" />
            {deletePending ? "Deleting…" : "Delete my account"}
          </Button>
        </GlassCardContent>
      </GlassCard>

    </div>
  );
}
