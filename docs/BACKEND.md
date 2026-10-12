# Backend system

## Apply the schema

Run both migrations against the Supabase project:

1. `supabase/migrations/202610110001_initial_schema.sql`
2. `supabase/migrations/202610120001_workspace_system.sql`

Existing users do not get a workspace automatically. For those accounts, insert one row:

```sql
insert into public.workspaces (user_id)
select id from public.profiles
on conflict (user_id) do nothing;
```

## Auth

Every protected route calls `requireUser()`, which uses the cookie session and `getUser()`. Do not trust the client for identity.

## Access gate

Workspace reads and writes call `assertActiveAccess()`. A user without a live entitlement receives `402 Active access required.`

## Money

All amounts are integer pence. Never store pounds as floats.

## Example

```bash
# Record a period (signed-in cookie required)
curl -X POST https://YOUR_APP/api/metrics \
  -H 'content-type: application/json' \
  -d '{"period_start":"2026-10-01","period_end":"2026-10-31","net_position_pence":8420000,"revenue_pence":2100000,"expenses_pence":1580000,"cash_pence":9600000,"burn_pence":1000000}'
```
