create table if not exists public.sudo_attempts (
  id bigserial primary key,
  fingerprint text not null,
  origin text,
  outcome text not null check (outcome in ('success', 'failure', 'blocked')),
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists sudo_attempts_fingerprint_window_idx
  on public.sudo_attempts (fingerprint, created_at desc);

alter table public.sudo_attempts enable row level security;

-- Allow only the service role (used by edge functions) to read/insert.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sudo_attempts'
      and policyname = 'sudo_attempts insert via service'
  ) then
    execute $policy$
      create policy "sudo_attempts insert via service"
        on public.sudo_attempts
        for insert
        to service_role
        with check (true);
    $policy$;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sudo_attempts'
      and policyname = 'sudo_attempts select via service'
  ) then
    execute $policy$
      create policy "sudo_attempts select via service"
        on public.sudo_attempts
        for select
        to service_role
        using (true);
    $policy$;
  end if;
end$$;
