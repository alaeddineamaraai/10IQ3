"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, LogOut } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPlan } from "@/lib/stripe/plans";
import type { AthleteProfile } from "@/lib/types/profile";

const FREE_PLAN_EMAIL_LIMIT = 5;
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

export function ProfileMenu({ profile }: { profile: AthleteProfile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    if (newPassword.length < 8) {
      setSecurityMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: "error", text: "Passwords don't match." });
      return;
    }

    if (isSampleMode) {
      setSecurityMessage({ type: "error", text: "Sign in to change your password." });
      return;
    }

    setSecurityPending(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSecurityPending(false);

    if (error) {
      setSecurityMessage({ type: "error", text: error.message });
      return;
    }

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

  const emailsRemaining = Math.max(FREE_PLAN_EMAIL_LIMIT - profile.emails_used, 0);
  const currentPlanDef = getPlan(profile.plan);
  const hasBillingAccount = !!profile.stripe_customer_id;

  return (
    <div className="relative" onMouseEnter={cancelClose} onMouseLeave={closeSoon}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full transition-smooth hover:opacity-80"
      >
        <Avatar>
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {initials(profile.name, profile.email)}
          </AvatarFallback>
        </Avatar>
      </button>

      <div
        aria-hidden={!open}
        className={cn(
          "glass-card-strong absolute right-0 top-full z-50 mt-2 w-80 origin-top-right p-0 transition-smooth",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-1 scale-95 opacity-0"
        )}
      >
        <Tabs defaultValue="account" className="gap-0">
            <TabsList className="m-2">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="flex flex-col gap-4 p-4 pt-2">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{profile.name ?? "Your account"}</span>
                <span className="text-xs text-muted-foreground">{profile.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <Badge variant="secondary" className="capitalize">
                  {profile.plan}
                </Badge>
              </div>
              {profile.plan === "free" && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-medium text-foreground">Free emails used</span>
                    <span className="text-muted-foreground">
                      {profile.emails_used} / {FREE_PLAN_EMAIL_LIMIT}
                    </span>
                  </div>
                  <Progress value={(profile.emails_used / FREE_PLAN_EMAIL_LIMIT) * 100} />
                  {emailsRemaining === 0 && (
                    <Link href="/paywall" className="text-xs text-primary hover:underline">
                      Upgrade for more emails →
                    </Link>
                  )}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut} disabled={signingOut}>
                <LogOut className="size-4" />
                {signingOut ? "Signing out…" : "Sign out"}
              </Button>
            </TabsContent>

            <TabsContent value="payment" className="flex flex-col gap-4 p-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current plan</span>
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
                <div className="flex flex-col gap-2">
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
                <Label className="text-xs">New password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Confirm password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {securityMessage && (
                <p
                  className={
                    securityMessage.type === "error"
                      ? "text-xs text-destructive"
                      : "text-xs text-primary"
                  }
                >
                  {securityMessage.text}
                </p>
              )}
              <Button size="sm" onClick={handlePasswordChange} disabled={securityPending}>
                {securityPending ? "Updating…" : "Update password"}
              </Button>
            </TabsContent>

            <TabsContent value="info" className="flex max-h-80 flex-col gap-3 overflow-y-auto p-4 pt-2">
              <p className="text-xs text-muted-foreground">
                What you filled in during onboarding — used to personalize your emails.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {INFO_FIELDS.map((field) => {
                  const value = profile[field.key];
                  return (
                    <div key={field.key} className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-muted-foreground">{field.label}</span>
                      <span className="truncate text-xs font-medium">
                        {value != null && value !== "" ? String(value) : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link href="/profile" className="text-xs text-primary hover:underline">
                Edit full profile →
              </Link>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
