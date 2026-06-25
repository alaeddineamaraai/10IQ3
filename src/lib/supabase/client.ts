import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Confirmation-link hash is parsed manually in AuthHashHandler so we
        // control the redirect-to-onboarding step instead of racing the SDK.
        detectSessionInUrl: false,
      },
    }
  );
}
