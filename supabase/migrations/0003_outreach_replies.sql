-- 0003_outreach_replies.sql
--
-- Adds real open/reply tracking. opened/replied on `outreach` were always
-- false placeholders until now — this wires them up to Resend webhooks
-- (see src/app/api/webhooks/resend/route.ts):
--   - email.opened sets opened/opened_at, matched via resend_email_id.
--   - email.received (Resend Inbound) appends a row to outreach_replies and
--     sets replied/replied_at, matched via the reply+<outreach_id>@... address.
--
-- Run this in the Supabase SQL editor (or `supabase db push`).

alter table public.outreach
  add column if not exists resend_email_id text,
  add column if not exists opened_at timestamptz,
  add column if not exists replied_at timestamptz;

create index if not exists outreach_resend_email_id_idx on public.outreach (resend_email_id);

create table if not exists public.outreach_replies (
  id uuid primary key default gen_random_uuid(),
  outreach_id uuid not null references public.outreach (id) on delete cascade,
  from_email text not null,
  subject text,
  body text,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists outreach_replies_outreach_id_idx on public.outreach_replies (outreach_id);

alter table public.outreach_replies enable row level security;

-- Select-only for the owning user; all writes come from the webhook handler
-- via the service-role client, which bypasses RLS, so no insert/update
-- policy is needed here.
drop policy if exists "outreach_replies_select_own" on public.outreach_replies;
create policy "outreach_replies_select_own"
  on public.outreach_replies for select
  using (
    exists (
      select 1 from public.outreach o
      where o.id = outreach_replies.outreach_id and o.user_id = auth.uid()
    )
  );
