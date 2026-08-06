"use client";

import { useState } from "react";
import { Check, Copy, Gift, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/glass-card";

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.netset.pro";

export function ReferralsClient({
  existingCode,
  referralCount,
  creditsEarned,
  maxReferrals,
}: {
  existingCode: string | null;
  referralCount: number;
  creditsEarned: number;
  maxReferrals: number;
}) {
  const [code, setCode] = useState<string | null>(existingCode);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralLink = code ? `${APP_BASE_URL}/auth?ref=${code}` : null;

  async function generateCode() {
    setLoading(true);
    const res = await fetch("/api/referrals/generate", { method: "POST" });
    const data = await res.json();
    if (data.code) setCode(data.code);
    setLoading(false);
  }

  async function copyLink() {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard>
          <GlassCardContent className="flex flex-col gap-1 px-5 py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Athletes referred</span>
            </div>
            <span className="text-3xl font-semibold tabular-nums">{referralCount} <span className="text-base font-normal text-muted-foreground">/ {maxReferrals}</span></span>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardContent className="flex flex-col gap-1 px-5 py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gift className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Emails earned</span>
            </div>
            <span className="text-3xl font-semibold tabular-nums text-primary">{creditsEarned}</span>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Link card */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Your referral link</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Share this link with teammates. When they sign up through it, you both benefit — they get a head start and you earn <strong>3 free emails</strong> per referral (up to {maxReferrals} referrals).
          </p>

          {referralLink ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 overflow-hidden rounded-lg border border-border bg-muted/40 px-3 py-2">
                <p className="truncate text-sm font-mono text-foreground">{referralLink}</p>
              </div>
              <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0">
                {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          ) : (
            <Button onClick={generateCode} disabled={loading} className="w-fit">
              {loading ? "Generating…" : "Generate my referral link"}
            </Button>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* How it works */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>How it works</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <ol className="flex flex-col gap-3">
            {[
              "Copy your unique referral link above.",
              "Share it with teammates who are also recruiting for college tennis.",
              "When they sign up through your link, you earn 3 free email credits instantly.",
              "You can earn up to 45 free emails total (15 referrals × 3 credits).",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{i + 1}</span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
