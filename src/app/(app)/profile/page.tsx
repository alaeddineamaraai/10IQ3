import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile, getSampleProfile } from "@/lib/data/profile";
import { ProfileForm } from "./profile-form";

async function loadProfile() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return getSampleProfile();
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return getSampleProfile();
  }

  const profile = await getProfile(supabase, auth.user.id);
  return profile ?? getSampleProfile();
}

export default async function ProfilePage() {
  const profile = await loadProfile();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Keep this up to date — it&apos;s what the AI uses to personalize your emails.
        </p>
      </div>

      <ProfileForm profile={profile} />
    </div>
  );
}
