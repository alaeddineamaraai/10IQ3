import Link from "next/link";

import { ProfileMenu } from "@/components/layout/profile-menu";
import type { AthleteProfile } from "@/lib/types/profile";

export function TopHeader({ profile }: { profile: AthleteProfile }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/40 bg-background/70 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10">
      <Link href="/dashboard" className="text-lg font-semibold tracking-tight transition-smooth hover:opacity-70">
        Netset
      </Link>
      <div className="md:hidden">
        <ProfileMenu profile={profile} />
      </div>
    </header>
  );
}
