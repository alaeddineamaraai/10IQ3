import { ViewTransition } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile, getSampleProfile } from "@/lib/data/profile";
import { getSampleNotifications } from "@/lib/data/notifications";
import { SideDock } from "@/components/layout/side-dock";
import { TopHeader } from "@/components/layout/top-header";
import { TourRoot } from "@/components/welcome/tour-root";

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

async function loadUnreadCount() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return getSampleNotifications().filter((n) => !n.reply_viewed_at).length;
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return getSampleNotifications().filter((n) => !n.reply_viewed_at).length;
  }

  const { count } = await supabase
    .from("outreach")
    .select("*", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .eq("replied", true)
    .is("reply_viewed_at", null);

  return count ?? 0;
}

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [profile, unreadCount] = await Promise.all([loadProfile(), loadUnreadCount()]);

  return (
    <TourRoot>
      <div className="flex min-h-screen flex-col">
        <TopHeader profile={profile} unreadCount={unreadCount} />
        <main className="flex-1 px-4 pb-32 pt-2 sm:px-6 md:pb-10 md:pl-56 md:pr-12 lg:pl-60 lg:pr-16">
          <ViewTransition name="page-content">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </ViewTransition>
        </main>
        <SideDock profile={profile} unreadCount={unreadCount} />
      </div>
    </TourRoot>
  );
}
