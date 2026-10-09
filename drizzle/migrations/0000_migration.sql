create table public.brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null default 'My brand',
  description text default '',
  website text default '',
  industry text default '',
  audience text default '',
  tone text default 'friendly, expert',
  language text default 'English',
  topics text[] not null default '{}',
  banned_topics text[] not null default '{}',
  cta text default '',
  platforms text[] not null default '{linkedin,x,instagram}',
  posts_per_run int not null default 2,
  require_approval boolean not null default true,
  automation_enabled boolean not null default false,
  onboarded boolean not null default false,
  paused_reason text,
  lock_until timestamptz,
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  brand_id uuid not null references public.brands(id) on delete cascade,
  url text not null,
  active boolean not null default true,
  last_fetched_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  brand_id uuid not null references public.brands(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  title text not null,
  url text not null,
  summary text default '',
  published_at timestamptz,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  unique (brand_id, url)
);
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  brand_id uuid not null references public.brands(id) on delete cascade,
  idea_id uuid references public.ideas(id) on delete set null,
  platform text not null,
  content text not null,
  hashtags text[] not null default '{}',
  image_prompt text default '',
  status text not null default 'draft',
  scheduled_for timestamptz,
  created_by text not null default 'ai',
  created_at timestamptz not null default now()
);
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  brand_id uuid references public.brands(id) on delete cascade,
  kind text not null default 'info',
  message text not null,
  created_at timestamptz not null default now()
);
do $$ declare t text; begin
  foreach t in array array['brands','sources','ideas','posts','activity_log'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;
create index on public.posts (brand_id, created_at desc);
create index on public.ideas (brand_id, created_at desc);
create index on public.activity_log (user_id, created_at desc);

create schema if not exists private;
create table private.cron_token (id int primary key default 1, token text not null default encode(gen_random_bytes(24),'hex'));
insert into private.cron_token default values;
create or replace function public.verify_cron_token(_token text) returns boolean
language sql stable security definer set search_path = private, public as $$
  select exists(select 1 from private.cron_token where token = _token)
$$;
revoke all on function public.verify_cron_token(text) from public, anon, authenticated;
grant execute on function public.verify_cron_token(text) to service_role;