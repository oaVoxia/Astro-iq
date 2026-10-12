-- Workspace domain for the financial intelligence product.
-- User-owned data. Writes allowed only for the owning user under RLS.

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default 'Workspace' check (char_length(name) between 1 and 80),
  currency text not null default 'gbp' check (currency = 'gbp'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.metrics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  net_position_pence bigint not null check (net_position_pence between -1000000000000 and 1000000000000),
  revenue_pence bigint not null default 0 check (revenue_pence >= 0),
  expenses_pence bigint not null default 0 check (expenses_pence >= 0),
  cash_pence bigint not null default 0,
  burn_pence bigint not null default 0 check (burn_pence >= 0),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint metrics_period_valid check (period_end >= period_start),
  constraint metrics_unique_period unique (workspace_id, period_start)
);
create index metrics_user_period_idx on public.metrics(user_id, period_start desc);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_user_created_idx on public.notes(user_id, created_at desc);

create trigger workspaces_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();
create trigger metrics_updated_at before update on public.metrics
  for each row execute function public.set_updated_at();
create trigger notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

-- Auto-create a workspace when a profile is created.
create or replace function public.handle_new_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.workspaces (user_id, name)
  values (new.id, 'Workspace')
  on conflict (user_id) do nothing;
  return new;
end; $$;
create trigger on_profile_created after insert on public.profiles
  for each row execute function public.handle_new_profile();

alter table public.workspaces enable row level security;
alter table public.metrics enable row level security;
alter table public.notes enable row level security;

create policy "workspaces_select_own" on public.workspaces
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "workspaces_update_own" on public.workspaces
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "metrics_select_own" on public.metrics
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "metrics_insert_own" on public.metrics
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "metrics_update_own" on public.metrics
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "metrics_delete_own" on public.metrics
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "notes_select_own" on public.notes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "notes_insert_own" on public.notes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "notes_update_own" on public.notes
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "notes_delete_own" on public.notes
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, update on public.workspaces to authenticated;
revoke update on public.workspaces from anon, authenticated;
grant update (name) on public.workspaces to authenticated;

grant select, insert, update, delete on public.metrics to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
