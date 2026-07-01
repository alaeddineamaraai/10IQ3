import Image from "next/image";
import { Lock } from "lucide-react";

export default function MacbookScrollDemo() {
  return (
    <div className="mx-auto max-w-5xl px-6 sm:px-10">
      <div className="overflow-hidden rounded-xl border border-border/30 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-border/20 bg-background/60 px-4 py-3 backdrop-blur-sm">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-red-500/70" />
            <div className="size-3 rounded-full bg-yellow-400/70" />
            <div className="size-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <Lock className="size-2.5" />
            netset.pro/dashboard
          </div>
          <div className="w-12" />
        </div>
        {/* Screenshot */}
        <Image
          src="/dashboard-screen.png"
          alt="Netset dashboard showing outreach analytics"
          width={1280}
          height={800}
          className="w-full"
          priority
        />
      </div>
    </div>
  );
}
