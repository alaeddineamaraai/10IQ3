import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCoachProfile, getSampleCoachProfile } from "@/lib/data/coaches";
import { CoachProfileView } from "@/components/coaches/coach-profile";

async function loadCoachProfile(coachEmail: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { profile: getSampleCoachProfile(coachEmail), isSample: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return { profile: getSampleCoachProfile(coachEmail), isSample: true };
  }

  const profile = await getCoachProfile(supabase, auth.user.id, coachEmail);
  return { profile, isSample: false };
}

export default async function CoachProfilePage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email } = await params;
  const coachEmail = decodeURIComponent(email);
  const { profile, isSample } = await loadCoachProfile(coachEmail);

  if (!profile) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/coaches"
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground transition-smooth hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All coaches
        </Link>
      </div>
      <CoachProfileView profile={profile} isSample={isSample} />
    </div>
  );
}
