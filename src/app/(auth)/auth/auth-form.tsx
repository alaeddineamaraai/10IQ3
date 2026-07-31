"use client";

import { useState, useEffect } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { isStrongPassword } from "@/lib/password";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}


type Mode = "sign-in" | "sign-up" | "forgot-password";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [pending, setPending] = useState(false);
  const [oauthPending, setOauthPending] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkInbox, setCheckInbox] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) setError(urlError);
  }, []);

  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setOauthPending(provider);
    const supabase = createSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthPending(null);
    }
    // On success the browser navigates away — no need to reset state.
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCheckInbox(false);

    if (!isStrongPassword(password)) {
      setError("Password doesn't meet the requirements below.");
      return;
    }

    setPending(true);

    const supabase = createSupabaseBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setPending(false);
      return;
    }

    if (data.user) {
      await fetch("/api/auth/signup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: data.user.id, email: data.user.email, marketing_consent: marketingConsent }),
      });
    }

    setPending(false);

    if (!data.session) {
      setCheckInbox(true);
      return;
    }

    window.location.href = "/onboarding";
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    setPending(false);
    if (resetError) { setError(resetError.message); return; }
    setResetSent(true);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const supabase = createSupabaseBrowserClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.session) {
      setError(signInError?.message ?? "Sign in failed");
      setPending(false);
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("profile_complete")
      .eq("id", data.session.user.id)
      .maybeSingle();

    setPending(false);
    window.location.href = profile?.profile_complete ? "/dashboard" : "/onboarding";
  }

  return (
    <GlassCard strong className="animate-in fade-in-0 slide-in-from-bottom-4 w-full max-w-md duration-500">
      <GlassCardHeader>
        <GlassCardTitle className="text-xl">Welcome to Netset</GlassCardTitle>
        <GlassCardDescription>
          AI-personalized recruiting emails to 1,800+ college coaches.
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent className="flex flex-col gap-4">
        {/* OAuth buttons */}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 hover:-translate-y-px hover:shadow-md"
            disabled={!!oauthPending}
            onClick={() => handleOAuth("google")}
          >
            <GoogleIcon />
            {oauthPending === "google" ? "Redirecting…" : "Continue with Google"}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {/* Email / password */}
        {mode === "forgot-password" ? (
          <div className="mt-2 flex flex-col gap-4">
            {resetSent ? (
              <p className="text-sm text-muted-foreground">
                Check your inbox — we sent a password reset link to <strong>{email}</strong>.
              </p>
            ) : (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            )}
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setMode("sign-in"); setError(null); setResetSent(false); }}
            >
              ← Back to sign in
            </button>
          </div>
        ) : (
        <Tabs
          value={mode}
          onValueChange={(value) => {
            setMode(value as Mode);
            setError(null);
            setCheckInbox(false);
          }}
        >
          <TabsList className="w-full">
            <TabsTrigger value="sign-in" className="flex-1">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="sign-up" className="flex-1">
              Sign up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sign-in" className="mt-4">
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Signing in…" : "Sign in"}
              </Button>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setMode("forgot-password"); setError(null); }}
              >
                Forgot password?
              </button>
            </form>
          </TabsContent>

          <TabsContent value="sign-up" className="mt-4">
            {checkInbox ? (
              <p className="text-sm text-muted-foreground">
                Check your inbox to confirm your email — then come back and
                you&apos;ll land straight in onboarding.
              </p>
            ) : (
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <PasswordRequirements password={password} />
                </div>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span className="text-xs leading-snug text-muted-foreground">
                    Send me product updates, recruiting tips, and feature announcements. You can unsubscribe anytime.
                  </span>
                </label>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? "Creating account…" : "Create account"}
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
