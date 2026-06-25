import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for privileged server-side writes (bypasses RLS).
 * Never import this from a Client Component or expose it to the browser.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
