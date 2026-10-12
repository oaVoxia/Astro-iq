# Backend system

## Apply the schema

Run these in order in the Supabase SQL editor:

1. `supabase/migrations/202610110001_initial_schema.sql`
2. `supabase/migrations/202610120001_workspace_system.sql`
3. `supabase/migrations/202610120002_tighten_workspace_rls.sql`
4. `supabase/migrations/202610120003_profile_fields.sql`
5. `supabase/migrations/202610120004_profile_avatar.sql`

Existing users do not get a workspace automatically. Backfill:

```sql
insert into public.workspaces (user_id)
select id from public.profiles
on conflict (user_id) do nothing;
```

## Auth redirect allow list

In Supabase Auth → URL Configuration, add:

- `http://localhost:3000/auth/callback`
- `https://YOUR_APP/auth/callback`
- `http://localhost:3000/reset-password`
- `https://YOUR_APP/reset-password`

Without these, email verification and password reset links fail.

## Auth and access

- `requireUser()` validates the cookie session.
- Workspace routes call `assertActiveAccess()` and return `402` without a live pass.
- RLS also requires ownership and an active entitlement for writes.
- Password changes require the current password.

## Rate limits

In-memory, per isolate. Create matching Cloudflare rate limiting rules before production.

| Route | Limit |
| --- | --- |
| checkout | 8 / 60s |
| metrics writes | 30 / 60s |
| notes writes | 20 / 60s |
| avatar uploads | 6 / 60s |

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/metrics` | List periods + summary |
| POST | `/api/metrics` | Create or upsert a period |
| PATCH | `/api/metrics/:id` | Update fields |
| DELETE | `/api/metrics/:id` | Delete a period |
| GET | `/api/metrics/export` | CSV export |
| GET | `/api/notes` | List notes |
| POST | `/api/notes` | Create a note |
| PATCH | `/api/notes/:id` | Update title or body |
| DELETE | `/api/notes/:id` | Delete a note |
| GET/PATCH | `/api/me` | Profile |
| POST/DELETE | `/api/me/avatar` | Profile image |

## Money

All amounts are integer pence. Never store pounds as floats.
