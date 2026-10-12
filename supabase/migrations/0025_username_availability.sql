-- Expose a safe, case-insensitive username availability check for onboarding.
-- The unique index on lower(username) remains the final race-safe safeguard.

create or replace function public.is_username_available(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select case
    when btrim(coalesce(p_username, '')) !~ '^[A-Za-z0-9_]{3,16}$' then false
    else not exists (
      select 1
      from public.profiles p
      where lower(p.username) = lower(btrim(p_username))
        and p.id <> auth.uid()
    )
  end;
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to authenticated;
