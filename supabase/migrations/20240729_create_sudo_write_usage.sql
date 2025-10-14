create table if not exists public.sudo_write_usage (
  id bigserial primary key,
  jti text not null,
  path text,
  outcome text not null check (outcome in ('ok', 'blocked', 'error')),
  created_at timestamptz not null default now()
);

create index if not exists sudo_write_usage_jti_idx
  on public.sudo_write_usage (jti, created_at desc);

alter table public.sudo_write_usage enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sudo_write_usage'
      and policyname = 'sudo_write_usage insert via service'
  ) then
    execute $policy$
      create policy "sudo_write_usage insert via service"
        on public.sudo_write_usage
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
      and tablename = 'sudo_write_usage'
      and policyname = 'sudo_write_usage select via service'
  ) then
    execute $policy$
      create policy "sudo_write_usage select via service"
        on public.sudo_write_usage
        for select
        to service_role
        using (true);
    $policy$;
  end if;
end$$;
