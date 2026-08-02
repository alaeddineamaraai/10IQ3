"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, LogOut, Settings } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPlan } from "@/lib/stripe/plans";
import { isStrongPassword } from "@/lib/password";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { PlanUsageSummary } from "@/components/billing/plan-usage-summary";
import type { AthleteProfile } from "@/lib/types/profile";

const isSampleMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

const INFO_FIELDS: { key: keyof AthleteProfile; label: string }[] = [
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

export function ProfileMenu({
  profile,
  variant = "header",
}: {
  profile: AthleteProfile;
  variant?: "header" | "dock" | "identity" | "sidebar";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityPending, setSecurityPending] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const [portalPending, setPortalPending] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Hover only ever cancels a pending close (so re-entering while the menu
  // is open keeps it open) — it never opens the menu itself. Opening is
  // click-only, otherwise hovering onto the avatar opens it and the
  // immediately-following click toggles it straight back closed.
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  function closeSoon() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  async function handleSignOut() {
    if (isSampleMode) {
      router.push("/auth");
      return;
    }
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

    // Same re-authentication gate as the Settings page: confirm the account
    // owner knows the current password before letting a live session swap it.
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

    if (error) {
      setSecurityMessage({ type: "error", text: error.message });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSecurityMessage({ type: "success", text: "Password updated." });
  }

  async function handleManageBilling() {
    setPortalError(null);

    if (isSampleMode) {
      setPortalError("Sign in to manage billing.");
      return;
    }

    setPortalPending(true);
    const res = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnUrl: window.location.href }),
    });
    const data = await res.json();
    setPortalPending(false);

    if (!res.ok) {
      setPortalError(data.error ?? "Couldn't open billing portal");
      return;
    }

    window.location.href = data.url;
  }

  const currentPlanDef = getPlan(profile.plan);
  const hasBillingAccount = !!profile.stripe_customer_id;

  return (
    <div className="relative" onMouseEnter={cancelClose} onMouseLeave={closeSoon}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2.5 transition-smooth hover:opacity-80",
          variant === "dock" && "control-pill h-14 w-14 justify-center rounded-full",
          variant === "header" && "control-pill size-11 justify-center rounded-full",
          variant === "identity" && "rounded-full pl-1 pr-1 sm:pr-3",
          variant === "sidebar" && "w-full rounded-xl px-2 py-2 hover:bg-muted/60"
        )}
      >
        <Avatar className={cn(variant === "sidebar" && "size-8 shrink-0")}>
          <AvatarFallback className={cn(
            "bg-primary/10 text-primary font-medium",
            variant === "sidebar" && "text-xs"
          )}>
            {initials(profile.name, profile.email)}
          </AvatarFallback>
        </Avatar>
        {variant === "identity" && (
          <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
            <span className="max-w-[10rem] truncate text-sm font-semibold">
              {profile.name ?? "Your account"}
            </span>
            <span className="max-w-[10rem] truncate text-xs text-muted-foreground">
              {profile.email}
            </span>
          </span>
        )}
        {variant === "sidebar" && (
          <span className="min-w-0 flex-1 flex-col items-start leading-tight flex">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium">
                {profile.name ?? "Your account"}
              </span>
              <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-primary">
                {profile.plan}
              </span>
            </span>
            <span className="max-w-full truncate text-xs text-muted-foreground">
              {profile.email}
            </span>
          </span>
        )}
      </button>

      <div
        aria-hidden={!open}
        className={cn(
          "surface-card absolute z-[60] w-80 overflow-hidden p-0 transition-smooth",
          variant === "dock" ? "left-full top-0 ml-3 origin-top-left"
          : variant === "sidebar" ? "bottom-full left-0 mb-2 origin-bottom-left"
          : "right-0 top-full mt-2 origin-top-right",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-1 scale-95 opacity-0"
        )}
      >
        <Tabs defaultValue="account" className="gap-0">
            <TabsList className="mx-auto my-2 flex w-[calc(100%-1rem)]">
              <TabsTrigger value="account" className="flex-1">Account</TabsTrigger>
              <TabsTrigger value="payment" className="flex-1">Payment</TabsTrigger>
              <TabsTrigger value="security" className="flex-1">Security</TabsTrigger>
              <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="flex flex-col items-center gap-4 p-4 pt-2 text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-medium">{profile.name ?? "Your account"}</span>
                <span className="text-xs text-muted-foreground">{profile.email}</span>
                <Badge variant="secondary" className="mt-1 capitalize">{profile.plan}</Badge>
              </div>
              <div className="w-full">
                <PlanUsageSummary profile={profile} />
              </div>
              <div className="flex w-full gap-2">
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-smooth hover:bg-muted"
                >
                  <Settings className="size-4" />
                  Settings
                </Link>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleSignOut} disabled={signingOut}>
                  <LogOut className="size-4" />
                  {signingOut ? "Signing out…" : "Sign out"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="flex flex-col items-center gap-4 p-4 pt-2 text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">Current plan</span>
                <Badge variant="secondary" className="capitalize">
                  {currentPlanDef ? `${currentPlanDef.name} — $${currentPlanDef.priceMonthly}/mo` : profile.plan}
                </Badge>
              </div>

              {hasBillingAccount ? (
                <Button size="sm" onClick={handleManageBilling} disabled={portalPending}>
                  <CreditCard className="size-4" />
                  {portalPending ? "Opening…" : "Manage billing"}
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    No billing account yet — upgrade to a paid plan to manage payment methods and invoices.
                  </p>
                  <Link href="/paywall" className={buttonVariants({ size: "sm" })}>
                    View plans →
                  </Link>
                </div>
              )}

              {portalError && <p className="text-xs text-destructive">{portalError}</p>}

              <p className="text-[11px] text-muted-foreground">
                Manage billing opens Stripe&apos;s secure customer portal — update your card, view invoices, or cancel.
              </p>
            </TabsContent>

            <TabsContent value="security" className="flex flex-col gap-3 p-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-center">Current password</Label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-center">New password</Label>
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
                <Label className="text-xs text-center">Confirm password</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {securityMessage && (
                <p
                  className={cn(
                    "text-center text-xs",
                    securityMessage.type === "error" ? "text-destructive" : "text-primary"
                  )}
                >
                  {securityMessage.text}
                </p>
              )}
              <Button size="sm" className="w-full" onClick={handlePasswordChange} disabled={securityPending}>
                {securityPending ? "Updating…" : "Update password"}
              </Button>
            </TabsContent>

            <TabsContent value="info" className="flex max-h-80 flex-col gap-3 overflow-y-auto p-4 pt-2">
              <p className="text-center text-xs text-muted-foreground">
                What you filled in during onboarding — used to personalize your emails.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {INFO_FIELDS.map((field) => {
                  const value = profile[field.key];
                  return (
                    <div key={field.key} className="flex flex-col items-center gap-0.5 text-center">
                      <span className="text-[11px] text-muted-foreground">{field.label}</span>
                      <span className="truncate text-xs font-medium">
                        {value != null && value !== "" ? String(value) : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link href="/profile" className="text-center text-xs text-primary hover:underline">
                Edit full profile →
              </Link>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
