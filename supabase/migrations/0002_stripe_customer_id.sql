-- 0002_stripe_customer_id.sql
--
-- Adds a column to associate each athlete with a Stripe Customer object,
-- so the Stripe Customer Portal (saved payment methods, invoice history,
-- plan management) has something to manage. The existing paywall flow only
-- created bare PaymentIntents with no Customer attached.

alter table public.users
  add column if not exists stripe_customer_id text;

create unique index if not exists users_stripe_customer_id_idx
  on public.users (stripe_customer_id)
  where stripe_customer_id is not null;
