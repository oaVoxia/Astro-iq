-- Astroiq initial schema. Apply through Supabase migrations; never expose service-role credentials.
create extension if not exists pgcrypto;

create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
create type public.entitlement_status as enum ('active', 'revoked', 'expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  tier text not null check (tier in ('starter','professional','annual')),
  duration_days integer not null check (duration_days in (30,90,365)),
  amount_total integer not null check (amount_total > 0),
  currency text not null check (currency = 'gbp'),
  status public.order_status not null default 'pending',
  stripe_checkout_session_id text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint orders_tier_duration_match check (
    (tier = 'starter' and duration_days = 30) or
    (tier = 'professional' and duration_days = 90) or
    (tier = 'annual' and duration_days = 365)
  )
);
create index orders_user_created_idx on public.orders(user_id, created_at desc);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text unique,
  amount_total integer not null check (amount_total > 0),
  amount_refunded integer not null default 0 check (amount_refunded >= 0),
  currency text not null check (currency = 'gbp'),
  status text not null check (status in ('paid','partially_refunded','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_user_created_idx on public.payments(user_id, created_at desc);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  tier text not null check (tier in ('starter','professional','annual')),
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  status public.entitlement_status not null default 'active',
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint entitlement_interval_valid check (expires_at > starts_at)
);
create index entitlements_user_expiry_idx on public.entitlements(user_id, status, expires_at desc);

create table public.webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 120), ''))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.entitlements enable row level security;
alter table public.webhook_events enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;
create policy "orders_select_own" on public.orders for select to authenticated using ((select auth.uid()) = user_id);
-- Orders are created and updated only by trusted server routes after authentication.
create policy "payments_select_own" on public.payments for select to authenticated using ((select auth.uid()) = user_id);
create policy "entitlements_select_own" on public.entitlements for select to authenticated using ((select auth.uid()) = user_id);
-- No client policies for webhook_events/audit_logs. Writes to orders, payments and entitlements are server-only.
revoke insert, update, delete on public.orders from anon, authenticated;
revoke all on public.webhook_events from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;
revoke insert, update, delete on public.payments from anon, authenticated;
revoke insert, update, delete on public.entitlements from anon, authenticated;

create or replace function public.fulfill_paid_checkout(
  p_event_id text, p_session_id text, p_order_id uuid, p_user_id uuid,
  p_tier text, p_duration_days integer, p_amount_total integer,
  p_currency text, p_payment_intent_id text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_start timestamptz;
  v_expiry timestamptz;
  v_rows integer;
begin
  insert into public.webhook_events(event_id, event_type)
  values (p_event_id, 'checkout.session.paid') on conflict (event_id) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if v_order.user_id <> p_user_id or v_order.tier <> p_tier or v_order.duration_days <> p_duration_days
     or v_order.amount_total <> p_amount_total or v_order.currency <> p_currency then
    raise exception 'order data mismatch';
  end if;
  if v_order.stripe_checkout_session_id is not null and v_order.stripe_checkout_session_id <> p_session_id then
    raise exception 'checkout session mismatch';
  end if;
  -- A second distinct success event for an already-paid order must not create another grant.
  if v_order.status = 'paid' then return; end if;
  if v_order.status <> 'pending' then raise exception 'order is not payable'; end if;

  select greatest(now(), coalesce(max(e.expires_at) filter (where e.status = 'active' and e.expires_at > now()), now()))
    into v_start from public.entitlements e where e.user_id = p_user_id;
  v_expiry := v_start + make_interval(days => p_duration_days);

  update public.orders set status = 'paid', paid_at = now(), stripe_checkout_session_id = p_session_id where id = p_order_id;
  insert into public.payments(order_id, user_id, stripe_checkout_session_id, stripe_payment_intent_id, amount_total, currency, status)
  values (p_order_id, p_user_id, p_session_id, p_payment_intent_id, p_amount_total, p_currency, 'paid');
  insert into public.entitlements(order_id, user_id, tier, starts_at, expires_at, status)
  values (p_order_id, p_user_id, p_tier, v_start, v_expiry, 'active');
  insert into public.audit_logs(actor_user_id, action, target_user_id, metadata)
  values (null, 'entitlement.granted', p_user_id, jsonb_build_object('order_id', p_order_id, 'tier', p_tier, 'duration_days', p_duration_days));
end; $$;

create or replace function public.process_refund_event(
  p_event_id text, p_payment_intent_id text, p_refunded_amount integer, p_amount integer
) returns void language plpgsql security definer set search_path = '' as $$
declare v_payment public.payments%rowtype; v_rows integer; v_status text; v_refunded integer;
begin
  insert into public.webhook_events(event_id, event_type)
  values (p_event_id, 'charge.refunded') on conflict (event_id) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return; end if;
  select * into v_payment from public.payments where stripe_payment_intent_id = p_payment_intent_id for update;
  if not found then raise exception 'payment not found yet; retry refund event'; end if;
  if p_refunded_amount < 0 or p_amount <> v_payment.amount_total or p_refunded_amount > p_amount then raise exception 'refund amount mismatch'; end if;
  v_refunded := greatest(p_refunded_amount, v_payment.amount_refunded);
  v_status := case when v_refunded >= p_amount then 'refunded' else 'partially_refunded' end;
  update public.payments set amount_refunded = v_refunded, status = v_status where id = v_payment.id;
  update public.orders set status = v_status::public.order_status where id = v_payment.order_id;
  if v_status = 'refunded' then
    update public.entitlements set status = 'revoked', revoked_at = now() where order_id = v_payment.order_id and status = 'active';
  end if;
  insert into public.audit_logs(actor_user_id, action, target_user_id, metadata)
  values (null, 'payment.' || v_status, v_payment.user_id, jsonb_build_object('order_id', v_payment.order_id, 'amount_refunded', v_refunded));
end; $$;

revoke all on function public.fulfill_paid_checkout(text,text,uuid,uuid,text,integer,integer,text,text) from public, anon, authenticated;
revoke all on function public.process_refund_event(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.fulfill_paid_checkout(text,text,uuid,uuid,text,integer,integer,text,text) to service_role;
grant execute on function public.process_refund_event(text,text,integer,integer) to service_role;
