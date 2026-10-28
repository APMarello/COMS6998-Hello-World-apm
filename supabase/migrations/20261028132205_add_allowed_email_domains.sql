create table public.allowed_email_domains (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (domain = lower(domain)),
  check (domain ~ '^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$')
);

create unique index allowed_email_domains_domain_lower_idx
  on public.allowed_email_domains (lower(domain));

alter table public.allowed_email_domains enable row level security;
revoke all on table public.allowed_email_domains from anon, authenticated;
grant select on table public.allowed_email_domains to authenticated;

create policy "Authenticated users can read active allowed email domains"
  on public.allowed_email_domains
  for select
  to authenticated
  using (is_active);

insert into public.allowed_email_domains (domain)
values ('barnard.edu'), ('columbia.edu'), ('gmail.com')
on conflict (lower(domain)) do update
set is_active = true,
    updated_at = now();
