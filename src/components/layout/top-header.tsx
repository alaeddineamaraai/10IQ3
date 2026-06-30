import Link from "next/link";

import { ProfileMenu } from "@/components/layout/profile-menu";
import type { AthleteProfile } from "@/lib/types/profile";

export function TopHeader({ profile }: { profile: AthleteProfile }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
      <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
        Netset
      </Link>
      <div className="md:hidden">
        <ProfileMenu profile={profile} />
      </div>
    </header>
  );
}
