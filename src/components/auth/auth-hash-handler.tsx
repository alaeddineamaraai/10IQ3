"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Supabase's email-confirmation link redirects back with
 * #access_token=...&refresh_token=...&type=signup in the URL hash (implicit
 * grant flow) — there's no default page that handles this, and the redirect
 * lands on whatever the project's Site URL is configured to (the marketing
 * homepage), not /auth. Mounted in the root layout so it catches the hash
 * no matter which page it lands on. We detect it on mount, verify the
 * token, make sure a users row exists, persist the session, strip the hash,
 * and land directly in onboarding step 1 with no re-entering of
 * email/password. This must only fire for the confirmation case —
 * detectSessionInUrl is disabled on the browser client (see
 * lib/supabase/client.ts) specifically so normal sign-in never races this.
 */
function hasSignupHash() {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  return hash.includes("access_token") && hash.includes("type=signup");
}

export function AuthHashHandler() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(hasSignupHash);

  useEffect(() => {
    if (!hasSignupHash()) return;

    (async () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        setVerifying(false);
        return;
      }

      const confirmRes = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token }),
      });

      if (!confirmRes.ok) {
        setVerifying(false);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      await supabase.auth.setSession({ access_token, refresh_token });

      // Strip the hash so a refresh doesn't re-trigger this flow.
      window.history.replaceState(null, "", window.location.pathname);

      router.replace("/onboarding");
    })();
  }, [router]);

  if (!verifying) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 text-sm text-muted-foreground">
      Confirming your email…
    </div>
  );
}
