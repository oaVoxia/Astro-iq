# Backend system

## Apply the schema

1. `supabase/migrations/202610110001_initial_schema.sql`
2. `supabase/migrations/202610120001_workspace_system.sql`
3. `supabase/migrations/202610120002_tighten_workspace_rls.sql`

Existing users do not get a workspace automatically. Backfill:

```sql
insert into public.workspaces (user_id)
select id from public.profiles
on conflict (user_id) do nothing;
```

## Auth and access

- `requireUser()` validates the cookie session.
- Workspace routes call `assertActiveAccess()` and return `402` without a live pass.
- RLS also requires ownership and an active entitlement for writes.

## Rate limits

In-memory, per isolate. Replace with Cloudflare rate limiting in production.

| Route | Limit |
| --- | --- |
| metrics writes | 30 / 60s |
| notes writes | 20 / 60s |

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/metrics` | List periods + summary |
| POST | `/api/metrics` | Create or upsert a period |
| PATCH | `/api/metrics/:id` | Update fields |
| DELETE | `/api/metrics/:id` | Delete a period |
| GET | `/api/notes` | List notes |
| POST | `/api/notes` | Create a note |
| PATCH | `/api/notes/:id` | Update title or body |
| DELETE | `/api/notes/:id` | Delete a note |

## Money

All amounts are integer pence. Never store pounds as floats.
