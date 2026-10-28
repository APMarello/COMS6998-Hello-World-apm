alter table public.profiles
  add column is_whitelisted boolean not null default true;

update public.profiles
set is_whitelisted = true
where is_whitelisted is null;

create or replace function private.prevent_user_whitelist_changes()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.is_whitelisted is distinct from new.is_whitelisted
    and current_user not in ('postgres', 'service_role') then
    raise exception 'Only an administrator can change a profile whitelist status.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_user_whitelist_changes() from public;

create trigger prevent_user_whitelist_changes
before update of is_whitelisted on public.profiles
for each row
execute function private.prevent_user_whitelist_changes();
