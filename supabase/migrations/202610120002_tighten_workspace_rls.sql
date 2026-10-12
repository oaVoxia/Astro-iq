-- Tighten workspace writes.
-- 1. workspace_id must belong to the caller.
-- 2. Writes require an active entitlement.

create or replace function public.has_active_access(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.entitlements e
    where e.user_id = p_user_id
      and e.status = 'active'
      and e.starts_at <= now()
      and e.expires_at > now()
  );
$$;

revoke all on function public.has_active_access(uuid) from public, anon;
grant execute on function public.has_active_access(uuid) to authenticated, service_role;

drop policy if exists "metrics_insert_own" on public.metrics;
drop policy if exists "metrics_update_own" on public.metrics;
drop policy if exists "metrics_delete_own" on public.metrics;
drop policy if exists "notes_insert_own" on public.notes;
drop policy if exists "notes_update_own" on public.notes;
drop policy if exists "notes_delete_own" on public.notes;
drop policy if exists "workspaces_update_own" on public.workspaces;

create policy "workspaces_update_own" on public.workspaces
  for update to authenticated
  using ((select auth.uid()) = user_id and public.has_active_access((select auth.uid())))
  with check ((select auth.uid()) = user_id);

create policy "metrics_insert_own" on public.metrics
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.has_active_access((select auth.uid()))
    and exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.user_id = (select auth.uid())
    )
  );

create policy "metrics_update_own" on public.metrics
  for update to authenticated
  using ((select auth.uid()) = user_id and public.has_active_access((select auth.uid())))
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.user_id = (select auth.uid())
    )
  );

create policy "metrics_delete_own" on public.metrics
  for delete to authenticated
  using ((select auth.uid()) = user_id and public.has_active_access((select auth.uid())));

create policy "notes_insert_own" on public.notes
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.has_active_access((select auth.uid()))
    and exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.user_id = (select auth.uid())
    )
  );

create policy "notes_update_own" on public.notes
  for update to authenticated
  using ((select auth.uid()) = user_id and public.has_active_access((select auth.uid())))
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.user_id = (select auth.uid())
    )
  );

create policy "notes_delete_own" on public.notes
  for delete to authenticated
  using ((select auth.uid()) = user_id and public.has_active_access((select auth.uid())));
