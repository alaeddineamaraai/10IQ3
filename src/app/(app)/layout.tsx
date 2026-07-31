import { ViewTransition } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile, getSampleProfile } from "@/lib/data/profile";
import { getSampleNotifications } from "@/lib/data/notifications";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
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
      {/* Fixed-height app shell: the sidebar and top bar stay put and only
          the content region scrolls. Document-level scrolling is avoided on
          purpose — it interacts badly with the desktop `zoom` in globals.css.
          Page gutter is full-bleed on phones, inset from lg. */}
      <div className="h-screen bg-page lg:p-4">
        <div className="shell-panel flex h-full overflow-hidden max-lg:rounded-none">
          {/* Sidebar is transparent — the panel underneath supplies the fill,
              so the panel's rounded corners stay unbroken. */}
          <aside
            style={{ viewTransitionName: "site-sidebar" }}
            className="hidden w-[16.5rem] shrink-0 overflow-y-auto border-r border-border/60 lg:block"
          >
            <AppSidebar profile={profile} unreadCount={unreadCount} />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <AppTopbar profile={profile} unreadCount={unreadCount} />

            <main className="flex-1 overflow-y-auto px-3 pb-3 sm:px-4 sm:pb-4">
              <div className="surface-inset min-h-full p-4 sm:p-6">
                <ViewTransition name="page-content">
                  <div className="mx-auto w-full max-w-6xl">{children}</div>
                </ViewTransition>
              </div>
            </main>
          </div>
        </div>
      </div>
    </TourRoot>
  );
}
