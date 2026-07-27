import { Suspense } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCoachesWithOutreach, getSampleCoaches } from "@/lib/data/coaches";
import { ComposeClient } from "./compose-client";

async function loadCoaches() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { coaches: getSampleCoaches(), isSample: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { coaches: getSampleCoaches(), isSample: true };

  return { coaches: await getCoachesWithOutreach(supabase, auth.user.id), isSample: false };
}

export default async function ComposePage() {
  const { coaches, isSample } = await loadCoaches();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compose</h1>
        <p className="text-sm text-muted-foreground">
          Select coaches on the left, draft and send on the right.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <ComposeClient coaches={coaches} isSampleMode={isSample} />
      </Suspense>
    </div>
  );
}
