import { Suspense } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDemoCoaches, getCoachesWithOutreach } from "@/lib/data/coaches";
import { getProfile } from "@/lib/data/profile";
import { ComposeClient } from "./compose-client";

async function loadData() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { coaches: await getDemoCoaches(), isSampleMode: true, missingFields: [] as string[] };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { coaches: await getDemoCoaches(), isSampleMode: true, missingFields: [] as string[] };
  }

  const [coaches, profile] = await Promise.all([
    getCoachesWithOutreach(supabase, auth.user.id),
    getProfile(supabase, auth.user.id),
  ]);

  const missingFields: string[] = [];
  if (!profile?.wtn && !profile?.utr) missingFields.push("WTN / UTR rating");
  if (!profile?.grad_year) missingFields.push("graduation year");
  if (!profile?.gender) missingFields.push("gender");
  if (!profile?.target_div) missingFields.push("target division");

  return { coaches, isSampleMode: false, missingFields };
}

export default async function ComposePage() {
  const { coaches, isSampleMode, missingFields } = await loadData();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compose</h1>
        <p className="text-sm text-muted-foreground">
          <span className="hidden md:inline">Select coaches on the left, draft and send on the right.</span>
          <span className="md:hidden">Pick coaches, then switch to Drafts to generate and send.</span>
        </p>
      </div>

      {!isSampleMode && missingFields.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p className="text-sm text-foreground">
            Your profile is missing{" "}
            <span className="font-medium">{missingFields.join(", ")}</span>
            {" — "}the AI generates much more personalized emails with this filled in.{" "}
            <Link href="/profile" className="font-semibold text-amber-600 hover:underline dark:text-amber-400">
              Complete your profile →
            </Link>
          </p>
        </div>
      )}

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
