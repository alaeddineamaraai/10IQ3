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

  const sendingDomain = domains.data.find((d) => d.name === "mail.netset.pro");
  if (sendingDomain) {
    const { error } = await resend.domains.update({ id: sendingDomain.id, openTracking: true });
    result.openTracking = error ? { error: error.message } : { enabled: true, domainId: sendingDomain.id };
  } else {
    result.openTracking = { error: "mail.netset.pro domain not found in Resend account" };
  }

  const inboundDomain = domains.data.find((d) => d.name === "reply.netset.pro");
  if (!inboundDomain) {
    const { data: created, error } = await resend.domains.create({
      name: "reply.netset.pro",
      capabilities: { sending: "disabled", receiving: "enabled" },
    });
    if (error) {
      result.inboundDomain = { error: error.message };
    } else {
      result.inboundDomain = created;
    }
  } else {
    const { data: full, error } = await resend.domains.get(inboundDomain.id);
    result.inboundDomain = error ? { error: error.message } : full;
  }

  const { data: webhooks, error: webhooksError } = await resend.webhooks.list();
  const endpoint = "https://www.netset.pro/api/webhooks/resend";
  const existing = !webhooksError && webhooks?.data.find((w) => w.endpoint === endpoint);

  if (existing) {
    result.webhook = { id: existing.id, endpoint: existing.endpoint, alreadyExisted: true };
  } else {
    const { data: webhook, error } = await resend.webhooks.create({
      endpoint,
      events: ["email.opened", "email.received"],
    });
    result.webhook = error ? { error: error.message } : webhook;
  }

  return NextResponse.json(result);
}
