-- Make onboarding and historical daily-survival XP one authoritative operation.
-- This also prevents optional achievement evaluation from rolling back the XP
-- grant if an older achievement dependency is missing in a partially migrated
-- database.

create or replace function public.initialize_phd_survival(p_phd_year smallint)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_today date;
  v_academic_start date;
  v_start_date date;
  v_days integer;
  v_amount integer;
  v_inserted integer := 0;
  v_total integer;
  v_level integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_phd_year < 1 or p_phd_year > 8 then raise exception 'PhD year must be between 1 and 8'; end if;

  select * into v_profile from public.profiles where id = auth.uid() for update;
  if not found then raise exception 'Profile unavailable'; end if;

  v_today := (now() at time zone coalesce(v_profile.timezone, 'UTC'))::date;
  v_academic_start := make_date(
    extract(year from v_today)::integer - case when v_today < make_date(extract(year from v_today)::integer, 9, 1) then 1 else 0 end,
    9,
    1
  );
  v_start_date := (v_academic_start - make_interval(years => (p_phd_year - 1)::integer))::date;
  v_days := greatest(1, (v_today - v_start_date) + 1);
  v_amount := v_days * 2;

  insert into public.xp_ledger(user_id, source_type, amount, source_key)
  values (auth.uid(), 'historical_daily_survival', v_amount, 'historical-daily-survival:' || auth.uid()::text)
  on conflict (user_id, source_key) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 1 then
    update public.player_state
    set total_xp = total_xp + v_amount,
        last_survival_date = v_today,
        updated_at = now()
    where user_id = auth.uid();

    -- Rewards are secondary to the historical grant. A missing/old reward
    -- dependency must never turn a successful signup into a zero-XP signup.
    begin
      perform public.evaluate_achievements(auth.uid());
    exception when others then
      null;
    end;
  end if;

  select total_xp into v_total from public.player_state where user_id = auth.uid();
  select coalesce(max(level), 1) into v_level from public.level_thresholds where total_xp_required <= v_total;
  return jsonb_build_object(
    'daysAwarded', case when v_inserted = 1 then v_days else 0 end,
    'xpAwarded', case when v_inserted = 1 then v_amount else 0 end,
    'totalXp', v_total,
    'level', v_level
  );
end;
$$;
revoke all on function public.initialize_phd_survival(smallint) from public;
grant execute on function public.initialize_phd_survival(smallint) to authenticated;

create or replace function public.complete_onboarding(
  p_username text,
  p_phd_year smallint,
  p_avatar jsonb,
  p_timezone text
)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_total integer;
  v_level integer;
  v_reward jsonb;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_phd_year < 1 or p_phd_year > 8 then raise exception 'PhD year must be between 1 and 8'; end if;
  if p_username is null or length(trim(p_username)) < 3 then raise exception 'Username is too short'; end if;

  update public.profiles
  set username = trim(p_username),
      phd_year = p_phd_year,
      avatar = coalesce(p_avatar, '{}'::jsonb),
      onboarding_complete = true,
      timezone = coalesce(nullif(trim(p_timezone), ''), 'UTC'),
      updated_at = now()
  where id = auth.uid();
  if not found then raise exception 'Profile unavailable'; end if;

  v_reward := public.initialize_phd_survival(p_phd_year);
  select total_xp into v_total from public.player_state where user_id = auth.uid();
  select coalesce(max(level), 1) into v_level from public.level_thresholds where total_xp_required <= v_total;

  return jsonb_build_object(
    'daysAwarded', coalesce(v_reward->'daysAwarded', '0'::jsonb),
    'xpAwarded', coalesce(v_reward->'xpAwarded', '0'::jsonb),
    'totalXp', v_total,
    'level', v_level
  );
end;
$$;
revoke all on function public.complete_onboarding(text, smallint, jsonb, text) from public;
grant execute on function public.complete_onboarding(text, smallint, jsonb, text) to authenticated;
