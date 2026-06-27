import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile, getSampleProfile } from "@/lib/data/profile";
import { BottomDock } from "@/components/layout/bottom-dock";
import { TopHeader } from "@/components/layout/top-header";

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

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await loadProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <TopHeader profile={profile} />
      <main className="flex-1 px-4 pb-32 pt-2 sm:px-6 lg:px-10">{children}</main>
      <BottomDock />
    </div>
  );
}
