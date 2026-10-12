-- Keep PhD year in sync with the academic year while allowing manual corrections.
-- The app calls sync_phd_year when a profile is loaded or focused.

alter table public.profiles
  add column if not exists phd_year_last_synced_on date;

update public.profiles
set phd_year_last_synced_on = current_date
where phd_year_last_synced_on is null;

alter table public.profiles
  alter column phd_year_last_synced_on set default current_date,
  alter column phd_year_last_synced_on set not null;

create or replace function public.sync_phd_year()
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_today date;
  v_last_synced date;
  v_current_anchor date;
  v_last_anchor date;
  v_elapsed integer;
  v_year integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into v_profile
  from public.profiles
  where id = auth.uid()
  for update;
  if not found then raise exception 'Profile unavailable'; end if;

  v_today := (now() at time zone coalesce(v_profile.timezone, 'UTC'))::date;
  v_last_synced := coalesce(v_profile.phd_year_last_synced_on, v_today);
  v_year := extract(year from v_today)::integer;
  v_current_anchor := make_date(v_year - case when v_today < make_date(v_year, 9, 1) then 1 else 0 end, 9, 1);
  v_year := extract(year from v_last_synced)::integer;
  v_last_anchor := make_date(v_year - case when v_last_synced < make_date(v_year, 9, 1) then 1 else 0 end, 9, 1);
  v_elapsed := greatest(0, extract(year from v_current_anchor)::integer - extract(year from v_last_anchor)::integer);

  update public.profiles
  set phd_year = least(8, phd_year + v_elapsed),
      phd_year_last_synced_on = v_today,
      updated_at = case when v_elapsed > 0 then now() else updated_at end
  where id = auth.uid();

  select phd_year into v_year from public.profiles where id = auth.uid();
  return jsonb_build_object('phdYear', v_year, 'advancedBy', least(v_elapsed, 8));
end;
$$;
revoke all on function public.sync_phd_year() from public;
grant execute on function public.sync_phd_year() to authenticated;

create or replace function public.set_phd_year(p_phd_year smallint)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_today date;
  v_timezone text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_phd_year < 1 or p_phd_year > 8 then raise exception 'PhD year must be between 1 and 8'; end if;

  -- Apply any due September progression before accepting the manual correction.
  perform public.sync_phd_year();
  select timezone into v_timezone from public.profiles where id = auth.uid();
  v_today := (now() at time zone coalesce(v_timezone, 'UTC'))::date;
  update public.profiles
  set phd_year = p_phd_year,
      phd_year_last_synced_on = v_today,
      updated_at = now()
  where id = auth.uid();
  return jsonb_build_object('phdYear', p_phd_year);
end;
$$;
revoke all on function public.set_phd_year(smallint) from public;
grant execute on function public.set_phd_year(smallint) to authenticated;
