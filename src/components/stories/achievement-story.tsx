"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Download, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AthleteProfile } from "@/lib/types/profile";
import type { AchievementStats } from "@/lib/data/achievements";

const W = 1080;
const H = 1920;

type Achievement = {
  id: string;
  label: string;
  detail: string;
  draw: (ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) => void;
};

// ─── Canvas icon drawing ───────────────────────────────────────────────────

function drawEnvelopeCheck(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  const w = 200, h = 140, r = 16;
  const x = cx - w / 2, y = cy - h / 2;
  ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 8, y + 8); ctx.lineTo(cx, y + h * 0.55); ctx.lineTo(x + w - 8, y + 8); ctx.stroke();
  // check badge
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx + 74, cy - 52, 34, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(cx + 60, cy - 52); ctx.lineTo(cx + 72, cy - 39); ctx.lineTo(cx + 90, cy - 66); ctx.stroke();
}

function drawEnvelopeOpen(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  const w = 200, h = 130, r = 14;
  const x = cx - w / 2, y = cy - h / 2 + 18;
  ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x + r, y + 48); ctx.lineTo(x, y + 48);
  ctx.lineTo(x, y + h - r); ctx.quadraticCurveTo(x, y + h, x + r, y + h);
  ctx.lineTo(x + w - r, y + h); ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
  ctx.lineTo(x + w, y + 48); ctx.lineTo(x + w - r, y + 48);
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + 48); ctx.lineTo(cx, y); ctx.lineTo(x + w, y + 48); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 8, y + 52); ctx.lineTo(cx, y + h * 0.76); ctx.lineTo(x + w - 8, y + 52); ctx.stroke();
  ctx.lineWidth = 6; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.moveTo(cx - 44, y + 76); ctx.lineTo(cx + 44, y + 76); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 32, y + 96); ctx.lineTo(cx + 32, y + 96); ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawStackedEnvelopes(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, count: number) {
  const offsets = count <= 2 ? [10] : count <= 3 ? [20, 8] : [28, 16, 4];
  const w = 180, h = 120, r = 12;
  [...offsets, 0].forEach((dy, i) => {
    const isTop = i === offsets.length;
    ctx.globalAlpha = isTop ? 1 : 0.28 + (i / offsets.length) * 0.38;
    ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.lineCap = "round";
    const x = cx - w / 2, y = cy - h / 2 - dy;
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 8, y + 8); ctx.lineTo(cx, y + h * 0.55); ctx.lineTo(x + w - 8, y + 8); ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function drawTarget(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  [80, 52, 28].forEach((r, i) => {
    ctx.strokeStyle = color; ctx.lineWidth = 7;
    ctx.globalAlpha = i === 0 ? 0.30 : i === 1 ? 0.55 : 1;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.globalAlpha = 1; ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.28; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(cx - 100, cy); ctx.lineTo(cx - 88, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 88, cy); ctx.lineTo(cx + 100, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 100); ctx.lineTo(cx, cy - 88); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + 88); ctx.lineTo(cx, cy + 100); ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawRisingBars(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  [0.4, 0.62, 0.78, 1.0].forEach((h, i) => {
    const bw = 32, gap = 16;
    const totalW = 4 * bw + 3 * gap;
    const x = cx - totalW / 2 + i * (bw + gap);
    const bh = h * 104;
    const y = cy + 52 - bh;
    ctx.fillStyle = color; ctx.globalAlpha = 0.22 + (i / 3) * 0.78;
    ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.lineTo(x + bw - 8, y);
    ctx.quadraticCurveTo(x + bw, y, x + bw, y + 8);
    ctx.lineTo(x + bw, y + bh); ctx.lineTo(x, y + bh);
    ctx.lineTo(x, y + 8); ctx.quadraticCurveTo(x, y, x + 8, y);
    ctx.closePath(); ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(cx + 62, cy - 46); ctx.lineTo(cx + 84, cy - 70); ctx.lineTo(cx + 106, cy - 46); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 84, cy - 70); ctx.lineTo(cx + 84, cy + 64); ctx.stroke();
}

function drawTrophy(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 64, cy - 60); ctx.lineTo(cx - 64, cy + 8);
  ctx.quadraticCurveTo(cx - 64, cy + 52, cx, cy + 52);
  ctx.quadraticCurveTo(cx + 64, cy + 52, cx + 64, cy + 8);
  ctx.lineTo(cx + 64, cy - 60); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + 52); ctx.lineTo(cx, cy + 78); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 44, cy + 78); ctx.lineTo(cx + 44, cy + 78); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 64, cy - 38); ctx.quadraticCurveTo(cx - 96, cy - 38, cx - 96, cy - 8);
  ctx.quadraticCurveTo(cx - 96, cy + 22, cx - 64, cy + 10); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 64, cy - 38); ctx.quadraticCurveTo(cx + 96, cy - 38, cx + 96, cy - 8);
  ctx.quadraticCurveTo(cx + 96, cy + 22, cx + 64, cy + 10); ctx.stroke();
  // star
  const sr = 18, si = 9;
  ctx.fillStyle = color; ctx.globalAlpha = 0.38;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const ai = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(cx + sr * Math.cos(a), cy - 8 + sr * Math.sin(a));
    else ctx.lineTo(cx + sr * Math.cos(a), cy - 8 + sr * Math.sin(a));
    ctx.lineTo(cx + si * Math.cos(ai), cy - 8 + si * Math.sin(ai));
  }
  ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
}

function drawRocket(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
  // body
  ctx.beginPath();
  ctx.moveTo(cx, cy - 80);
  ctx.quadraticCurveTo(cx + 36, cy - 60, cx + 36, cy);
  ctx.lineTo(cx + 36, cy + 30);
  ctx.lineTo(cx - 36, cy + 30);
  ctx.lineTo(cx - 36, cy);
  ctx.quadraticCurveTo(cx - 36, cy - 60, cx, cy - 80);
  ctx.closePath(); ctx.stroke();
  // fins
  ctx.beginPath(); ctx.moveTo(cx - 36, cy + 10); ctx.lineTo(cx - 60, cy + 48); ctx.lineTo(cx - 36, cy + 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 36, cy + 10); ctx.lineTo(cx + 60, cy + 48); ctx.lineTo(cx + 36, cy + 30); ctx.stroke();
  // window
  ctx.beginPath(); ctx.arc(cx, cy - 16, 16, 0, Math.PI * 2);
  ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.stroke();
  // flame
  ctx.globalAlpha = 0.50; ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy + 30); ctx.quadraticCurveTo(cx - 8, cy + 68, cx, cy + 54);
  ctx.quadraticCurveTo(cx + 8, cy + 68, cx + 24, cy + 30);
  ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
}

// ─── Achievements list ─────────────────────────────────────────────────────

const ACHIEVEMENTS: Achievement[] = [
  { id: "replied",     label: "Coach replied",        detail: "A college coach responded to my outreach",      draw: drawEnvelopeCheck },
  { id: "opened",      label: "Email opened",          detail: "A college coach opened my recruiting email",    draw: drawEnvelopeOpen },
  { id: "ten",         label: "10 coaches reached",    detail: "Reached 10 college coaches this week",          draw: (c, x, y, col) => drawStackedEnvelopes(c, x, y, col, 2) },
  { id: "twentyfive",  label: "25 coaches reached",    detail: "Reached 25 college coaches this month",         draw: (c, x, y, col) => drawStackedEnvelopes(c, x, y, col, 3) },
  { id: "fifty",       label: "50 coaches reached",    detail: "50 college coaches and counting",               draw: (c, x, y, col) => drawStackedEnvelopes(c, x, y, col, 4) },
  { id: "d1",          label: "D1 target locked",      detail: "Actively recruiting for Division I tennis",     draw: drawTarget },
  { id: "record",      label: "New record set",        detail: "New personal season record achieved",           draw: drawRisingBars },
  { id: "milestone",   label: "Big milestone reached", detail: "A major recruiting milestone achieved",         draw: drawTrophy },
  { id: "launched",    label: "Recruiting launched",   detail: "Official college tennis recruiting underway",   draw: drawRocket },
];

// ─── Unlock rules ──────────────────────────────────────────────────────────
// An achievement story can only be selected and downloaded once the athlete
// has actually earned it, computed from real outreach + profile signals.

const UNLOCK: Record<string, { test: (s: AchievementStats) => boolean; hint: string }> = {
  launched:   { test: (s) => s.sent >= 1,    hint: "Send your first email to unlock" },
  opened:     { test: (s) => s.opened >= 1,  hint: "Get an email opened to unlock" },
  replied:    { test: (s) => s.replied >= 1, hint: "Get a coach reply to unlock" },
  ten:        { test: (s) => s.sent >= 10,   hint: "Reach 10 coaches to unlock" },
  twentyfive: { test: (s) => s.sent >= 25,   hint: "Reach 25 coaches to unlock" },
  fifty:      { test: (s) => s.sent >= 50,   hint: "Reach 50 coaches to unlock" },
  d1:         { test: (s) => s.targetD1,     hint: "Set a D1 target to unlock" },
  record:     { test: (s) => s.hasRecord,    hint: "Add your singles record to unlock" },
  milestone:  { test: (s) => s.replied >= 3, hint: "Get 3 coach replies to unlock" },
};

function isUnlocked(id: string, stats: AchievementStats): boolean {
  return UNLOCK[id]?.test(stats) ?? true;
}

// ─── Photo backgrounds ─────────────────────────────────────────────────────
// Four real aerial court photos live in /public/achievements. Each achievement
// maps to one of them; the five without a dedicated shot reuse a base photo
// with a distinct canvas filter so every card still reads as its own picture.
// Files are same-origin, so drawing them to the canvas does NOT taint it and
// toDataURL() downloads keep working.

const COURT = {
  clay: "/achievements/clay.jpg",
  grass: "/achievements/grass.jpg",
  blue1: "/achievements/blue1.jpg",
  blue2: "/achievements/blue2.jpg",
} as const;

const PHOTOS: Record<string, { src: string; filter: string }> = {
  // Clean, one per base photo
  replied:    { src: COURT.grass, filter: "none" },
  ten:        { src: COURT.clay,  filter: "none" },
  twentyfive: { src: COURT.blue1, filter: "none" },
  launched:   { src: COURT.blue2, filter: "none" },
  // Filtered variants for the remaining five
  opened:     { src: COURT.grass, filter: "saturate(0.62) brightness(1.08)" },
  fifty:      { src: COURT.clay,  filter: "hue-rotate(-22deg) saturate(1.25) brightness(0.9)" },
  d1:         { src: COURT.blue1, filter: "contrast(1.15) saturate(1.3) brightness(1.06)" },
  record:     { src: COURT.grass, filter: "hue-rotate(38deg) saturate(1.15)" },
  milestone:  { src: COURT.blue2, filter: "sepia(0.5) hue-rotate(-12deg) saturate(1.5) brightness(1.05)" },
};

const COURT_SRCS = Array.from(new Set(Object.values(COURT)));

function photoFor(id: string) {
  return PHOTOS[id] ?? { src: COURT.blue1, filter: "none" };
}

// ─── Palettes ──────────────────────────────────────────────────────────────

type Palette = {
  name: string;
  bg1: string; bg2: string; bg3: string;
  cardFill: string; cardStroke: string;
  text: string; muted: string; accent: string; icon: string;
  tag: string; tagText: string;
};

const PALETTES: Palette[] = [
  {
    name: "Ink",
    bg1: "#0A0A0A", bg2: "#111111", bg3: "#080808",
    cardFill: "rgba(255,255,255,0.03)", cardStroke: "rgba(255,255,255,0.08)",
    text: "#FFFFFF", muted: "rgba(255,255,255,0.45)", accent: "#C4A46B", icon: "#C9AB72",
    tag: "rgba(196,164,107,0.12)", tagText: "#C4A46B",
  },
  {
    name: "Mocha",
    bg1: "#0E0700", bg2: "#1E0E04", bg3: "#0A0500",
    cardFill: "rgba(255,215,175,0.05)", cardStroke: "rgba(200,140,80,0.18)",
    text: "#FFF6EE", muted: "rgba(235,185,140,0.52)", accent: "#C97B42", icon: "#D4915A",
    tag: "rgba(201,123,66,0.14)", tagText: "#D4915A",
  },
  {
    name: "Night",
    bg1: "#06080F", bg2: "#080C1A", bg3: "#050710",
    cardFill: "rgba(150,175,255,0.05)", cardStroke: "rgba(90,120,240,0.18)",
    text: "#EDF0FF", muted: "rgba(160,178,235,0.50)", accent: "#6B8FFF", icon: "#7B9FFF",
    tag: "rgba(107,143,255,0.13)", tagText: "#8AABFF",
  },
  {
    name: "Grove",
    bg1: "#040A07", bg2: "#071209", bg3: "#050C07",
    cardFill: "rgba(100,210,145,0.05)", cardStroke: "rgba(80,185,120,0.16)",
    text: "#EDFAF3", muted: "rgba(130,205,160,0.50)", accent: "#4DB87A", icon: "#5DCB8A",
    tag: "rgba(77,184,122,0.13)", tagText: "#5DCB8A",
  },
];

// ─── Canvas draw ───────────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draw an image cover-fit into the full 1080×1920 frame, honouring a filter. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, filter: string) {
  const ir = img.width / img.height;
  const cr = W / H;
  let dw: number, dh: number;
  if (ir > cr) { dh = H; dw = H * ir; } else { dw = W; dh = W / ir; }
  const dx = (W - dw) / 2, dy = (H - dh) / 2;
  ctx.save();
  ctx.filter = filter && filter !== "none" ? filter : "none";
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

const FONT_DISPLAY = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif`;
const FONT_TEXT = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif`;

function drawStory(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  achievement: Achievement,
  profile: AthleteProfile,
  customText: string,
  logoImg: HTMLImageElement | null,
  photoImg: HTMLImageElement | null,
) {
  ctx.clearRect(0, 0, W, H);

  // ── Photographic background ──
  const photo = photoFor(achievement.id);
  if (photoImg) {
    drawCover(ctx, photoImg, photo.filter);
  } else {
    // Fallback while the photo loads (or is missing): palette gradient.
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.5, H * 0.9);
    bg.addColorStop(0, p.bg2); bg.addColorStop(0.5, p.bg1); bg.addColorStop(1, p.bg3);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  }

  // Overall legibility darken + palette colour wash
  ctx.fillStyle = "rgba(0,0,0,0.30)"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = p.accent + "12"; ctx.fillRect(0, 0, W, H);

  // Top scrim (for discreet branding)
  const topScrim = ctx.createLinearGradient(0, 0, 0, H * 0.32);
  topScrim.addColorStop(0, "rgba(0,0,0,0.72)"); topScrim.addColorStop(1, "transparent");
  ctx.fillStyle = topScrim; ctx.fillRect(0, 0, W, H * 0.32);

  // Bottom scrim (for the achievement content)
  const botScrim = ctx.createLinearGradient(0, H * 0.42, 0, H);
  botScrim.addColorStop(0, "transparent");
  botScrim.addColorStop(0.55, "rgba(6,5,4,0.72)");
  botScrim.addColorStop(1, "rgba(4,3,2,0.96)");
  ctx.fillStyle = botScrim; ctx.fillRect(0, H * 0.42, W, H * 0.58);

  // ── Discreet branding (top) ──
  const logoSize = 74;
  const logoY = 96;
  if (logoImg) {
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(W / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, W / 2 - logoSize / 2, logoY, logoSize, logoSize);
    ctx.restore();
  }
  ctx.font = `700 26px ${FONT_DISPLAY}`;
  ctx.fillStyle = "rgba(255,255,255,0.72)"; ctx.textAlign = "center";
  ctx.fillText("N E T S E T", W / 2, logoY + logoSize + 42);

  // ── Content block (bottom) ──
  const marginX = 96;
  ctx.textAlign = "left";

  // Category tag (pill)
  const tagText = achievement.label.toUpperCase();
  ctx.font = `700 28px ${FONT_DISPLAY}`;
  const tagPadX = 30, tagH = 58;
  const tagW = ctx.measureText(tagText).width + tagPadX * 2;
  let cursorY = H * 0.66;
  const tagR = tagH / 2;
  roundRect(ctx, marginX, cursorY, tagW, tagH, tagR);
  ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fill();
  roundRect(ctx, marginX, cursorY, tagW, tagH, tagR);
  ctx.strokeStyle = p.accent + "AA"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = p.accent;
  ctx.textBaseline = "middle";
  ctx.fillText(tagText, marginX + tagPadX, cursorY + tagH / 2 + 1);
  ctx.textBaseline = "alphabetic";

  // Title (wraps up to 2 lines)
  cursorY += tagH + 78;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#FFFFFF";
  const titleSize = achievement.label.length > 16 ? 82 : 96;
  ctx.font = `800 ${titleSize}px ${FONT_DISPLAY}`;
  const titleLines = wrapText(ctx, achievement.label, W - marginX * 2);
  titleLines.forEach((l, i) => ctx.fillText(l, marginX, cursorY + i * (titleSize + 6)));
  ctx.restore();
  cursorY += (titleLines.length - 1) * (titleSize + 6) + 64;

  // Detail / custom caption
  const detail = customText.trim() || achievement.detail;
  ctx.font = `400 38px ${FONT_TEXT}`;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  const detailLines = wrapText(ctx, detail, W - marginX * 2);
  detailLines.forEach((l, i) => ctx.fillText(l, marginX, cursorY + i * 50));
  cursorY += (detailLines.length - 1) * 50 + 90;

  // ── Athlete stat row ──
  const statParts: { label: string; value: string }[] = [];
  if (profile.name) statParts.push({ label: "Athlete", value: profile.name.split(" ")[0] ?? profile.name });
  if (profile.utr != null) statParts.push({ label: "UTR", value: String(profile.utr) });
  if (profile.grad_year != null) statParts.push({ label: "Class", value: String(profile.grad_year) });
  if (profile.singles_record) statParts.push({ label: "Record", value: profile.singles_record });

  if (statParts.length) {
    // Divider
    const divY = cursorY - 40;
    const divGrad = ctx.createLinearGradient(marginX, divY, W - marginX, divY);
    divGrad.addColorStop(0, "rgba(255,255,255,0.22)"); divGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = divGrad; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(marginX, divY); ctx.lineTo(W - marginX, divY); ctx.stroke();

    const colW = (W - marginX * 2) / statParts.length;
    statParts.forEach((sp, i) => {
      const x = marginX + colW * i;
      ctx.textAlign = "left";
      ctx.font = `700 46px ${FONT_DISPLAY}`;
      ctx.fillStyle = sp.label === "UTR" ? p.accent : "#FFFFFF";
      ctx.fillText(sp.value, x, cursorY + 26);
      ctx.font = `500 24px ${FONT_TEXT}`;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(sp.label.toUpperCase(), x, cursorY + 62);
    });
  }

  // ── Footer ──
  ctx.font = `500 28px ${FONT_TEXT}`;
  ctx.fillStyle = "rgba(255,255,255,0.42)"; ctx.textAlign = "center";
  ctx.fillText("netset.pro", W / 2, H - 80);
  ctx.textAlign = "left";
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// ─── Picker icon (small canvas per achievement) ────────────────────────────

function PickerIcon({ achievement, active }: { achievement: Achievement; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const SIZE = 32;
  const color = active ? "#C4A46B" : "#6B5E48";

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE * 2, SIZE * 2);
    ctx.save();
    ctx.scale((SIZE * 2) / 200, (SIZE * 2) / 200);
    achievement.draw(ctx, 100, 100, color);
    ctx.restore();
  }, [achievement, color]);

  return (
    <canvas
      ref={ref}
      width={SIZE * 2}
      height={SIZE * 2}
      style={{ width: SIZE, height: SIZE }}
    />
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function AchievementStory({
  profile,
  stats,
  trigger,
}: {
  profile: AthleteProfile;
  stats: AchievementStats;
  trigger?: React.ReactNode;
}) {
  // Default the picker to the first achievement the athlete has actually earned.
  const firstUnlockedIdx = Math.max(
    ACHIEVEMENTS.findIndex((a) => isUnlocked(a.id, stats)),
    0
  );

  const [open, setOpen] = useState(false);
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [achievementIdx, setAchievementIdx] = useState(firstUnlockedIdx);
  const [customText, setCustomText] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const photosRef = useRef<Record<string, HTMLImageElement>>({});
  const [assetsVersion, setAssetsVersion] = useState(0);

  // Preload the Netset logo PNG for canvas rendering
  useEffect(() => {
    const img = new Image();
    img.src = "/icon.png";
    img.onload = () => { logoImgRef.current = img; setAssetsVersion((v) => v + 1); };
  }, []);

  // Preload the court photos (same-origin — safe to draw to canvas & download)
  useEffect(() => {
    COURT_SRCS.forEach((src) => {
      if (photosRef.current[src]) return;
      const img = new Image();
      img.src = src;
      img.onload = () => { photosRef.current[src] = img; setAssetsVersion((v) => v + 1); };
    });
  }, []);

  const palette = PALETTES[paletteIdx];
  const achievement = ACHIEVEMENTS[achievementIdx];
  const achievementUnlocked = isUnlocked(achievement.id, stats);
  const unlockedCount = ACHIEVEMENTS.filter((a) => isUnlocked(a.id, stats)).length;

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const photoImg = photosRef.current[photoFor(achievement.id).src] ?? null;
    drawStory(ctx, palette, achievement, profile, customText, logoImgRef.current, photoImg);
  }, [open, paletteIdx, achievementIdx, customText, palette, achievement, profile, assetsVersion]);

  function handleDownload() {
    if (!achievementUnlocked) return;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const photoImg = photosRef.current[photoFor(achievement.id).src] ?? null;
    drawStory(ctx, palette, achievement, profile, customText, logoImgRef.current, photoImg);
    const link = document.createElement("a");
    link.download = "netset-story.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="touch-manipulation">
        {trigger ?? (
          <span className="flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:bg-muted/60 hover:text-foreground">
            <svg className="size-3" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="2.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M1 4.5l5 3 5-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Create story
          </span>
        )}
      </button>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 340, damping: 30 }}
                className="fixed inset-0 z-[301] flex items-end justify-center md:items-center"
              >
                <div
                  className="glass-card-strong flex w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl md:flex-row md:rounded-3xl"
                  style={{ maxHeight: "90dvh" }}
                >
                  {/* Preview — canvas keeps its 1080×1920 internal resolution;
                      the display size is responsive so the modal stays usable
                      on small screens without the preview eating the viewport. */}
                  <div className="flex shrink-0 flex-col items-center gap-3 border-b border-border/50 bg-muted/10 p-4 md:border-b-0 md:border-r md:p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Preview</p>
                    <div
                      className="relative w-[132px] overflow-hidden rounded-2xl shadow-xl sm:w-[168px] md:w-[291px]"
                      style={{ aspectRatio: `${W} / ${H}` }}
                    >
                      <canvas ref={canvasRef} width={W} height={H} className="block h-full w-full" />
                      {!achievementUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 backdrop-blur-[2px] px-3 text-center">
                          <Lock className="size-5 text-white/80" />
                          <p className="text-[11px] font-medium leading-snug text-white/80">
                            {UNLOCK[achievement.id]?.hint ?? "Locked"}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground/40">1080 × 1920 · Instagram Story</p>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-1 flex-col overflow-auto">
                    <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
                      <h2 className="font-semibold">Create story</h2>
                      <button onClick={() => setOpen(false)} className="flex size-8 items-center justify-center rounded-full bg-muted touch-manipulation">
                        <X className="size-4" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-5 p-5 md:min-h-0 md:overflow-auto">
                      {/* Achievement */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Achievement</label>
                          <span className="text-[11px] text-muted-foreground/40">{unlockedCount} of {ACHIEVEMENTS.length} earned</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {ACHIEVEMENTS.map((a, i) => {
                            const unlocked = isUnlocked(a.id, stats);
                            return (
                              <button
                                key={a.id}
                                onClick={() => unlocked && setAchievementIdx(i)}
                                disabled={!unlocked}
                                title={unlocked ? undefined : UNLOCK[a.id]?.hint}
                                className={cn(
                                  "flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-smooth touch-manipulation",
                                  !unlocked
                                    ? "cursor-not-allowed text-muted-foreground/45"
                                    : i === achievementIdx
                                      ? "bg-primary/10 text-primary font-medium"
                                      : "hover:bg-muted/50 text-muted-foreground",
                                )}
                              >
                                <span className={cn("shrink-0", !unlocked && "opacity-40")}>
                                  <PickerIcon achievement={a} active={i === achievementIdx && unlocked} />
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col">
                                  <span className="truncate">{a.label}</span>
                                  {!unlocked && (
                                    <span className="truncate text-[11px] text-muted-foreground/40">{UNLOCK[a.id]?.hint}</span>
                                  )}
                                </span>
                                {!unlocked && <Lock className="size-3.5 shrink-0 text-muted-foreground/40" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Caption */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Custom caption</label>
                        <input
                          type="text"
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          placeholder={achievement.detail}
                          maxLength={80}
                          className="rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Palette */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Color palette</label>
                        <div className="flex gap-2">
                          {PALETTES.map((p, i) => (
                            <button
                              key={p.name}
                              onClick={() => setPaletteIdx(i)}
                              title={p.name}
                              className={cn(
                                "flex h-10 flex-1 items-center justify-center rounded-xl border-2 text-xs font-medium transition-smooth touch-manipulation",
                                i === paletteIdx ? "border-primary" : "border-transparent",
                              )}
                              style={{ background: `linear-gradient(135deg, ${p.bg1}, ${p.bg2})`, color: p.text }}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border/50 p-5 flex flex-col gap-4">
                      {/* Social sharing */}
                      <div className="flex flex-col gap-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/45">
                          Share to
                        </p>
                        <div className="flex gap-2">
                          {/* Instagram */}
                          <div title="Coming soon" className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-border/25 bg-muted/8 px-2 py-2.5 text-[11px] cursor-not-allowed opacity-45">
                            <svg className="size-5" viewBox="0 0 24 24" fill="none">
                              <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.6"/>
                              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.6"/>
                              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
                            </svg>
                            <span className="text-muted-foreground">Instagram</span>
                            <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[9px] text-muted-foreground/60 -mt-0.5">Soon</span>
                          </div>

                          {/* TikTok */}
                          <div title="Coming soon" className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-border/25 bg-muted/8 px-2 py-2.5 text-[11px] cursor-not-allowed opacity-45">
                            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9a8.19 8.19 0 004.79 1.53V7.09a4.85 4.85 0 01-1.02-.4z"/>
                            </svg>
                            <span className="text-muted-foreground">TikTok</span>
                            <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[9px] text-muted-foreground/60 -mt-0.5">Soon</span>
                          </div>

                          {/* Facebook */}
                          <div title="Coming soon" className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-border/25 bg-muted/8 px-2 py-2.5 text-[11px] cursor-not-allowed opacity-45">
                            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span className="text-muted-foreground">Facebook</span>
                            <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[9px] text-muted-foreground/60 -mt-0.5">Soon</span>
                          </div>

                          {/* More dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setMoreOpen((v) => !v)}
                              className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 text-[11px] font-medium transition-smooth hover:bg-muted/40 touch-manipulation"
                            >
                              <svg className="size-5" viewBox="0 0 24 24" fill="none">
                                <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
                                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                                <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
                              </svg>
                              <span>More</span>
                            </button>

                            <AnimatePresence>
                              {moreOpen && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 4 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute bottom-full right-0 mb-2 w-48 overflow-hidden rounded-xl border border-border bg-background shadow-xl"
                                >
                                  {[
                                    { name: "YouTube", icon: <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/> },
                                    { name: "Snapchat", icon: <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509-.015.615-1.063.706-1.229.72-.45 0-.748.015-.748.015l-.016.015c-.016.24-.165.45-.42.509-3.257.539-4.723 3.878-4.791 4.014l-.015.015c-.18.344-.21.644-.12.868.195.45.883.675 1.333.81.135.044.255.09.344.119.827.329 1.232.719 1.213 1.168-.015.359-.284.689-.734.839-.15.06-.327.09-.509.09-.12 0-.299-.016-.464-.105-.373-.179-.732-.285-1.033-.3-.198 0-.326.045-.401.09.015.165.018.33.03.509l.003.061c.104 1.629.225 3.654-.299 4.847-1.582 3.545-4.939 3.821-5.93 3.821-.989 0-4.347-.276-5.93-3.821-.524-1.193-.403-3.218-.299-4.847l.003-.061c.012-.179.015-.344.03-.509-.075-.045-.203-.09-.401-.09-.3.015-.659.121-1.033.3-.165.09-.344.105-.464.105-.182 0-.359-.03-.509-.09-.45-.15-.734-.48-.734-.839-.015-.449.389-.839 1.213-1.168.089-.029.209-.075.344-.119.449-.135 1.138-.36 1.333-.81.09-.224.06-.524-.12-.868l-.016-.015c-.059-.136-1.525-3.475-4.79-4.014-.255-.044-.435-.27-.42-.509.015-.615 1.063-.706 1.229-.72.45 0 .748-.015.748-.015l.015-.015c.015-.239.165-.45.42-.509 3.264-.539 4.73-3.878 4.79-4.014l.016-.015c.18-.344.209-.644.12-.868-.195-.45-.884-.675-1.333-.81-.136-.044-.255-.09-.344-.119-.824-.329-1.228-.719-1.213-1.168.015-.36.284-.689.734-.838.15-.061.327-.09.509-.09.12 0 .299.016.464.104.374.181.733.285 1.033.301.198 0 .326-.045.401-.09-.015-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.225-3.654.299-4.847C7.859 1.069 11.216.793 12.206.793z"/> },
                                    { name: "X / Twitter", icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.932-9.07-8.348-11.43h6.13l4.267 5.71 5.521-5.71zm-1.161 17.52h1.833L7.084 4.126H5.117z"/> },
                                    { name: "Pinterest", icon: <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/> },
                                  ].map((p) => (
                                    <div key={p.name} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                      <div className="flex items-center gap-2.5">
                                        <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">{p.icon}</svg>
                                        <span className="text-muted-foreground">{p.name}</span>
                                      </div>
                                      <span className="rounded-full bg-muted/50 px-1.5 py-0.5 text-[9px] text-muted-foreground/50">
                                        Soon
                                      </span>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      {/* Download */}
                      <button
                        onClick={handleDownload}
                        disabled={!achievementUnlocked}
                        className={cn(
                          "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-smooth touch-manipulation",
                          achievementUnlocked
                            ? "bg-primary text-primary-foreground hover:opacity-90"
                            : "cursor-not-allowed bg-muted/40 text-muted-foreground/50",
                        )}
                      >
                        {achievementUnlocked ? <Download className="size-4" /> : <Lock className="size-4" />}
                        {achievementUnlocked ? "Save image · 1080 × 1920" : "Locked achievement"}
                      </button>
                      <p className="-mt-2 text-center text-xs text-muted-foreground/50">
                        {achievementUnlocked
                          ? "Save to camera roll · share anywhere"
                          : UNLOCK[achievement.id]?.hint ?? "Earn this achievement to download"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
