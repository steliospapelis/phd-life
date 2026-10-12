create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,16}$'),
  phd_year smallint not null default 1 check (phd_year between 1 and 8),
  selected_title_id uuid,
  timezone text not null default 'UTC',
  onboarding_complete boolean not null default false,
  avatar jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_username_ci on public.profiles (lower(username));

create table public.player_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  sanity smallint not null default 70 check (sanity between 0 and 100),
  last_survival_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.xp_ledger (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null, source_id uuid, amount integer not null check (amount > 0), source_key text,
  created_at timestamptz not null default now()
);
create unique index xp_ledger_source_key on public.xp_ledger(user_id, source_key) where source_key is not null;
create table public.sanity_ledger (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null, source_id uuid, delta integer not null, sanity_after smallint not null check (sanity_after between 0 and 100), created_at timestamptz not null default now()
);

create table public.task_categories (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, icon_key text not null, sort_order integer not null default 0, active boolean not null default true);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), category_id uuid not null references public.task_categories(id), slug text unique not null, name text not null,
  description text, xp_reward integer not null check (xp_reward > 0), sanity_delta integer not null default 0 check (sanity_delta between -25 and 25), icon_key text not null,
  is_major boolean not null default false, creates_social_event boolean not null default false, active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.task_logs (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, task_id uuid not null references public.tasks(id), created_at timestamptz not null default now());
create table public.level_thresholds (level smallint primary key, total_xp_required integer not null unique check (total_xp_required >= 0));
create table public.titles (id uuid primary key default gen_random_uuid(), name text unique not null, unlock_level smallint not null check (unlock_level > 0), active boolean not null default true);
alter table public.profiles add constraint profiles_selected_title_fk foreign key (selected_title_id) references public.titles(id);

create table public.milestone_catalog (id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, description text not null, icon_key text not null, progress_weight integer not null check (progress_weight > 0), active boolean not null default true, sort_order integer not null default 0);
create table public.user_milestones (user_id uuid references public.profiles(id) on delete cascade, milestone_id uuid references public.milestone_catalog(id) on delete cascade, completed_at timestamptz, primary key(user_id, milestone_id));
create table public.achievement_catalog (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, description text not null, icon_key text not null, rarity text not null, criteria_type text not null, criteria jsonb not null default '{}'::jsonb, active boolean not null default true, sort_order integer not null default 0);
create table public.user_achievements (user_id uuid references public.profiles(id) on delete cascade, achievement_id uuid references public.achievement_catalog(id) on delete cascade, unlocked_at timestamptz not null default now(), primary key(user_id, achievement_id));

create table public.friendships (id uuid primary key default gen_random_uuid(), requester_id uuid references public.profiles(id) on delete cascade, addressee_id uuid references public.profiles(id) on delete cascade, status text not null check (status in ('pending','accepted','declined')), created_at timestamptz not null default now(), unique(requester_id, addressee_id), check(requester_id <> addressee_id));
create table public.social_events (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, event_type text not null, text text not null, task_id uuid references public.tasks(id), created_at timestamptz not null default now());
create table public.social_reactions (event_id uuid references public.social_events(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, reaction text not null check (reaction in ('👏','🫡','💀')), created_at timestamptz not null default now(), primary key(event_id,user_id));

alter table public.profiles enable row level security; alter table public.player_state enable row level security; alter table public.xp_ledger enable row level security; alter table public.sanity_ledger enable row level security; alter table public.task_categories enable row level security; alter table public.tasks enable row level security; alter table public.task_logs enable row level security; alter table public.level_thresholds enable row level security; alter table public.titles enable row level security; alter table public.milestone_catalog enable row level security; alter table public.user_milestones enable row level security; alter table public.achievement_catalog enable row level security; alter table public.user_achievements enable row level security; alter table public.friendships enable row level security; alter table public.social_events enable row level security; alter table public.social_reactions enable row level security;

create policy "own profile read" on public.profiles for select using (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "own state read" on public.player_state for select using (user_id = auth.uid());
create policy "own ledger read" on public.xp_ledger for select using (user_id = auth.uid());
create policy "own sanity read" on public.sanity_ledger for select using (user_id = auth.uid());
create policy "catalogues readable" on public.task_categories for select using (active = true);
create policy "tasks readable" on public.tasks for select using (active = true);
create policy "levels readable" on public.level_thresholds for select using (true);
create policy "titles readable" on public.titles for select using (active = true);
create policy "milestones readable" on public.milestone_catalog for select using (active = true);
create policy "own milestones read" on public.user_milestones for select using (user_id = auth.uid());
create policy "achievement catalogue readable" on public.achievement_catalog for select using (active = true);
create policy "own achievements read" on public.user_achievements for select using (user_id = auth.uid());
create policy "friendships participant read" on public.friendships for select using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "friendships requester insert" on public.friendships for insert with check (requester_id = auth.uid());
create policy "friendships addressee update" on public.friendships for update using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());
create policy "social events visible to friends" on public.social_events for select using (user_id = auth.uid() or exists (select 1 from public.friendships f where f.status = 'accepted' and ((f.requester_id = auth.uid() and f.addressee_id = social_events.user_id) or (f.addressee_id = auth.uid() and f.requester_id = social_events.user_id))));
create policy "social reactions by friends" on public.social_reactions for insert with check (user_id = auth.uid() and exists (select 1 from public.social_events e where e.id = event_id));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles(id, username) values (new.id, 'research_' || substr(replace(new.id::text,'-',''),1,7)); insert into public.player_state(user_id) values (new.id); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.complete_task(p_task_id uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_task tasks%rowtype; v_total integer; v_before integer; v_level integer; v_previous_level integer; v_sanity integer; begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into v_task from public.tasks where id = p_task_id and active = true; if not found then raise exception 'Task unavailable'; end if;
  select total_xp, sanity into v_total, v_sanity from public.player_state where user_id = auth.uid() for update; v_before := v_total;
  insert into public.task_logs(user_id, task_id) values (auth.uid(), p_task_id);
  insert into public.xp_ledger(user_id, source_type, source_id, amount) values (auth.uid(), 'task', p_task_id, v_task.xp_reward);
  v_total := v_total + v_task.xp_reward; v_sanity := greatest(0, least(100, v_sanity + v_task.sanity_delta));
  insert into public.sanity_ledger(user_id, source_type, source_id, delta, sanity_after) values (auth.uid(), 'task', p_task_id, v_task.sanity_delta, v_sanity);
  select coalesce(max(level),1) into v_level from public.level_thresholds where total_xp_required <= v_total;
  select coalesce(max(level),1) into v_previous_level from public.level_thresholds where total_xp_required <= v_before;
  update public.player_state set total_xp=v_total, sanity=v_sanity, updated_at=now() where user_id=auth.uid();
  perform public.evaluate_achievements(auth.uid());
  return jsonb_build_object('xpAwarded', v_task.xp_reward, 'totalXp', v_total, 'sanity', v_sanity, 'level', v_level, 'levelUp', v_level > v_previous_level);
end; $$;
revoke all on function public.complete_task(uuid) from public; grant execute on function public.complete_task(uuid) to authenticated;

create or replace function public.claim_daily_survival() returns jsonb language plpgsql security definer set search_path = public as $$
declare v_today date; v_amount integer := 2; v_inserted integer; v_total integer; begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  v_today := (now() at time zone coalesce((select timezone from public.profiles where id=auth.uid()), 'UTC'))::date;
  insert into public.xp_ledger(user_id, source_type, amount, source_key) values (auth.uid(), 'daily_survival', v_amount, 'daily-survival:' || v_today::text) on conflict do nothing;
  get diagnostics v_inserted = row_count; if v_inserted = 1 then update public.player_state set total_xp=total_xp+v_amount, last_survival_date=v_today where user_id=auth.uid(); end if;
  select total_xp into v_total from public.player_state where user_id=auth.uid(); return jsonb_build_object('awarded', v_inserted = 1, 'xpAwarded', case when v_inserted=1 then v_amount else 0 end, 'totalXp', v_total);
end; $$;
revoke all on function public.claim_daily_survival() from public; grant execute on function public.claim_daily_survival() to authenticated;

create or replace function public.select_title(p_title_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare v_unlock smallint; v_level smallint;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select unlock_level into v_unlock from public.titles where id = p_title_id and active = true;
  if not found then raise exception 'Title unavailable'; end if;
  select coalesce(max(level), 1) into v_level from public.level_thresholds where total_xp_required <= (select total_xp from public.player_state where user_id = auth.uid());
  if v_level < v_unlock then raise exception 'Title is still locked'; end if;
  update public.profiles set selected_title_id = p_title_id, updated_at = now() where id = auth.uid();
end; $$;
revoke all on function public.select_title(uuid) from public; grant execute on function public.select_title(uuid) to authenticated;

create or replace function public.toggle_milestone(p_milestone_id uuid) returns boolean language plpgsql security definer set search_path = public as $$
declare v_completed boolean;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.milestone_catalog where id = p_milestone_id and active = true) then raise exception 'Milestone unavailable'; end if;
  select completed_at is not null into v_completed from public.user_milestones where user_id = auth.uid() and milestone_id = p_milestone_id;
  insert into public.user_milestones(user_id, milestone_id, completed_at) values (auth.uid(), p_milestone_id, case when coalesce(v_completed, false) then null else now() end)
    on conflict (user_id, milestone_id) do update set completed_at = case when public.user_milestones.completed_at is null then now() else null end;
  return not coalesce(v_completed, false);
end; $$;
revoke all on function public.toggle_milestone(uuid) from public; grant execute on function public.toggle_milestone(uuid) to authenticated;

create or replace function public.evaluate_achievements(p_user_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare a record; v_count integer; v_target integer; v_task_slug text; v_category_slug text;
begin
  for a in select * from public.achievement_catalog where active = true loop
    v_target := coalesce((a.criteria->>'count')::integer, 1);
    if a.criteria_type = 'total_xp' then select total_xp into v_count from public.player_state where user_id = p_user_id;
    elsif a.criteria_type = 'task_count' then select count(*) into v_count from public.task_logs where user_id = p_user_id;
    elsif a.criteria_type = 'milestone_count' then select count(*) into v_count from public.user_milestones where user_id = p_user_id and completed_at is not null;
    elsif a.criteria_type = 'specific_task_count' then v_task_slug := a.criteria->>'task_slug'; select count(*) into v_count from public.task_logs l join public.tasks t on t.id = l.task_id where l.user_id = p_user_id and t.slug = v_task_slug;
    elsif a.criteria_type = 'category_task_count' then v_category_slug := a.criteria->>'category_slug'; select count(*) into v_count from public.task_logs l join public.tasks t on t.id = l.task_id join public.task_categories c on c.id = t.category_id where l.user_id = p_user_id and c.slug = v_category_slug;
    else continue;
    end if;
    if coalesce(v_count, 0) >= v_target then insert into public.user_achievements(user_id, achievement_id) values (p_user_id, a.id) on conflict do nothing; end if;
  end loop;
end; $$;
revoke all on function public.evaluate_achievements(uuid) from public; grant execute on function public.evaluate_achievements(uuid) to authenticated;
