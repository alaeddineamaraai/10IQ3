"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

type Mode = "sign-in" | "sign-up";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInbox, setCheckInbox] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCheckInbox(false);
    setPending(true);

    const supabase = createSupabaseBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setPending(false);
      return;
    }

    // Insert the users row unconditionally, before branching on whether a
    // session came back. Confirmation-required signups return a user with
    // no session — checking for a missing access_token first (as the old
    // app did) meant this insert never ran for the normal signup case.
    if (data.user) {
      await fetch("/api/auth/signup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: data.user.id, email: data.user.email }),
      });
    }

    setPending(false);

    if (!data.session) {
      setCheckInbox(true);
      return;
    }

    router.push("/onboarding");
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

    // supabase-js already surfaces failures via `error` with the real
    // error_code/message rather than a generic shape, so checking `error`
    // here (instead of hand-parsing a fetch response for `.error`) avoids
    // the old bug where a failed login with no top-level `.error` field was
    // treated as successful.
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
    router.push(profile?.profile_complete ? "/dashboard" : "/onboarding");
  }

  return (
    <GlassCard strong className="w-full max-w-md">
      <GlassCardHeader>
        <GlassCardTitle className="text-xl">Welcome to Netset</GlassCardTitle>
        <GlassCardDescription>
          AI-personalized recruiting emails to 1,800+ college coaches.
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
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
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? "Creating account…" : "Create account"}
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </GlassCardContent>
    </GlassCard>
  );
}
