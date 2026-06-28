import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * One-time setup endpoint: enables open tracking on the sending domain,
 * creates the reply.netset.pro inbound domain, and creates the webhook
 * subscription — all things the Resend API can do without a dashboard
 * click. Gated by ADMIN_SETUP_TOKEN so it isn't a public backdoor; meant
 * to be deleted right after use, not a permanent route.
 */
export async function POST(request: Request) {
  if (request.headers.get("x-admin-token") !== process.env.ADMIN_SETUP_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const result: Record<string, unknown> = {};

  const { data: domains, error: domainsError } = await resend.domains.list();
  if (domainsError) {
    return NextResponse.json({ error: domainsError.message, step: "domains.list" }, { status: 500 });
  }
  result.domains = domains.data.map((d) => ({ id: d.id, name: d.name }));

  // The account's plan only allows 1 domain, so receiving is enabled on the
  // existing sending domain itself (mail.netset.pro) rather than a separate
  // reply.* domain — reply-to addresses use reply+<id>@mail.netset.pro.
  const sendingDomain = domains.data.find((d) => d.name === "mail.netset.pro");
  if (sendingDomain) {
    const { error } = await resend.domains.update({
      id: sendingDomain.id,
      openTracking: true,
      capabilities: { receiving: "enabled" },
    });
    if (error) {
      result.openTracking = { error: error.message };
      result.inboundDomain = { error: error.message };
    } else {
      result.openTracking = { enabled: true, domainId: sendingDomain.id };
      const { data: full, error: getError } = await resend.domains.get(sendingDomain.id);
      result.inboundDomain = getError ? { error: getError.message } : full;
    }
  } else {
    result.openTracking = { error: "mail.netset.pro domain not found in Resend account" };
    result.inboundDomain = { error: "mail.netset.pro domain not found in Resend account" };
  }

  // The signing_secret is only ever returned at creation time, so if a
  // webhook to this endpoint already exists (from a prior run of this
  // route), it's deleted and recreated to mint a secret we can capture.
  const { data: webhooks, error: webhooksError } = await resend.webhooks.list();
  const endpoint = "https://www.netset.pro/api/webhooks/resend";
  const existing = !webhooksError && webhooks?.data.find((w) => w.endpoint === endpoint);

  if (existing) {
    await resend.webhooks.remove(existing.id);
  }

  const { data: webhook, error: createError } = await resend.webhooks.create({
    endpoint,
    events: ["email.opened", "email.received"],
  });
  result.webhook = createError ? { error: createError.message } : webhook;

  return NextResponse.json(result);
}
