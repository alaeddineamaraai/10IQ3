-- 0010_stripe_subscriptions.sql
--
-- Plan upgrades were previously a single one-time PaymentIntent (see
-- 0008_metered_plans.sql) with no recurring re-billing — a user who upgraded
-- kept Pro/Elite forever after paying once. This migrates to real Stripe
-- Subscriptions: stripe_subscription_id lets the app find/update a user's
-- subscription (e.g. when switching plans), and subscription_status mirrors
-- Stripe's status (active/past_due/canceled/...) so the webhook can react to
-- failed renewals and cancellations without a second lookup to Stripe.
--
-- Run this in the Supabase SQL editor (or `supabase db push`).

alter table public.users
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text;

create unique index if not exists users_stripe_subscription_id_idx
  on public.users (stripe_subscription_id)
  where stripe_subscription_id is not null;
