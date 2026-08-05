import { Suspense } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCoachesWithOutreach, getSampleCoaches } from "@/lib/data/coaches";
import { ComposeClient } from "./compose-client";

// Returns whether this render is showing sample data — either because
// Supabase isn't configured at all, or because the visitor isn't logged in
// (e.g. the homepage's "Try live demo" link, which intentionally works
// without an account). ComposeClient needs this explicitly: it can't infer
// "sample" from env vars alone, since production has real Supabase
// configured but an anonymous demo visitor still gets sample data.
async function loadCoaches(): Promise<{
  coaches: Awaited<ReturnType<typeof getCoachesWithOutreach>> | ReturnType<typeof getSampleCoaches>;
  isSampleMode: boolean;
}> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { coaches: getSampleCoaches(), isSampleMode: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { coaches: getSampleCoaches(), isSampleMode: true };

  return { coaches: await getCoachesWithOutreach(supabase, auth.user.id), isSampleMode: false };
}

export default async function ComposePage() {
  const { coaches, isSampleMode } = await loadCoaches();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compose</h1>
        <p className="text-sm text-muted-foreground">
          <span className="hidden md:inline">Select coaches on the left, draft and send on the right.</span>
          <span className="md:hidden">Pick coaches, then switch to Drafts to generate and send.</span>
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <ComposeClient coaches={coaches} isSampleMode={isSampleMode} />
      </Suspense>
    </div>
  );
}
