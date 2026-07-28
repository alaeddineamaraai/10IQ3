import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// 1x1 transparent GIF — the classic email open-tracking pixel.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7",
  "base64"
);

const PIXEL_RESPONSE_INIT: ResponseInit = {
  status: 200,
  headers: {
    "Content-Type": "image/gif",
    "Content-Length": String(PIXEL.length),
    // Never let clients or intermediate proxies cache this — every open
    // (including re-opens) should reach the server, and the pixel itself
    // never changes so it wouldn't matter if the request were skipped due
    // to caching — except that's exactly the request we need every time.
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
  },
};

/**
 * Self-hosted open-tracking pixel: `<img>`-embedded in every outreach email
 * (see /api/outreach/send), independent of Resend's own open tracking,
 * which requires a per-domain dashboard toggle in Resend that's easy to
 * miss or that resets. This endpoint is unauthenticated by necessity — it's
 * loaded by the coach's email client, not by a logged-in user — so it's
 * scoped to nothing but flipping one boolean on one row via the admin
 * client, matched by an unguessable UUID.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fire-and-forget: never let a DB hiccup — or Supabase being unconfigured
  // in this environment — delay or break pixel delivery. The pixel must
  // always render so the coach's email client never shows a broken image.
  if (id && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createSupabaseAdminClient();
      await admin
        .from("outreach")
        .update({ opened: true, opened_at: new Date().toISOString() })
        .eq("id", id)
        .eq("opened", false);
    } catch {
      // Swallow — pixel delivery must never fail because of this.
    }
  }

  return new Response(PIXEL, PIXEL_RESPONSE_INIT);
}
