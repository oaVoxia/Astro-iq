-- Profile fields for account management.
alter table public.profiles
  add column if not exists company text check (company is null or char_length(company) between 1 and 120),
  add column if not exists job_title text check (job_title is null or char_length(job_title) between 1 and 80),
  add column if not exists timezone text not null default 'Europe/London' check (char_length(timezone) between 1 and 64),
  add column if not exists bio text check (bio is null or char_length(bio) <= 500);

grant update (display_name, company, job_title, timezone, bio) on public.profiles to authenticated;
