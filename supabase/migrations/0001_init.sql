-- Clipnaa schema: profiles (plan + usage), jobs (one per uploaded video), clips (results).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'creator', 'pro', 'agency')),
  minutes_quota integer not null default 30,
  minutes_used numeric(10, 2) not null default 0,
  period_start timestamptz not null default now(),
  paddle_customer_id text,
  paddle_subscription_id text,
  subscription_status text,
  billing_manage_url text,
  billing_cancel_url text,
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'done', 'failed')),
  progress text,
  source_key text not null,
  source_name text,
  title text,
  caption_language text not null default 'Arabic',
  num_clips integer not null default 5 check (num_clips between 1 and 10),
  min_len integer not null default 20,
  max_len integer not null default 60,
  brief text not null default '',
  reframe text not null default 'auto' check (reframe in ('auto', 'face', 'blur', 'crop')),
  duration_sec numeric(10, 2),
  minutes_charged numeric(10, 2),
  summary text,
  profiles jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jobs_user_created on public.jobs (user_id, created_at desc);

create table public.clips (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  idx integer not null,
  title text not null,
  start_sec numeric(10, 2) not null,
  end_sec numeric(10, 2) not null,
  hook_text text,
  why_it_works text,
  virality_score integer,
  copy jsonb not null,
  file_key text not null,
  created_at timestamptz not null default now(),
  unique (job_id, idx)
);

-- Row level security: users can read their own rows. Only the server (service role) writes
-- billing and results; users may create jobs for themselves.
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.clips enable row level security;

create policy "own profile" on public.profiles for select using (auth.uid() = id);
create policy "own jobs" on public.jobs for select using (auth.uid() = user_id);
create policy "own clips" on public.clips for select using (auth.uid() = user_id);

-- New sign-up -> profile row on the free plan.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Free plans reset every 30 days; paid plans reset when Paddle renews (see webhook).
create function public.minutes_remaining(p_user uuid) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles;
begin
  select * into p from public.profiles where id = p_user for update;
  if p.plan = 'free' and p.period_start < now() - interval '30 days' then
    update public.profiles set minutes_used = 0, period_start = now() where id = p_user
    returning * into p;
  end if;
  return greatest(p.minutes_quota - p.minutes_used, 0);
end;
$$;

-- Charge minutes for a finished job, once. Returns false if the job was already charged.
create function public.charge_job(p_job uuid, p_minutes numeric) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  j public.jobs;
begin
  select * into j from public.jobs where id = p_job for update;
  if j.minutes_charged is not null then
    return false;
  end if;
  update public.jobs set minutes_charged = p_minutes where id = p_job;
  update public.profiles set minutes_used = minutes_used + p_minutes where id = j.user_id;
  return true;
end;
$$;

revoke execute on function public.minutes_remaining(uuid) from public, anon, authenticated;
revoke execute on function public.charge_job(uuid, numeric) from public, anon, authenticated;
