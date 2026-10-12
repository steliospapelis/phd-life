-- Replace the legacy Journey catalog with the canonical eight-milestone PhD progression.
-- Existing user_milestones rows are preserved. Only unambiguous legacy entries are
-- renamed in place; ambiguous historical milestones are retired from the Journey.

alter table public.milestone_catalog
  add column if not exists xp_reward integer not null default 0,
  add column if not exists is_automatic boolean not null default false,
  add column if not exists is_core_journey boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.milestone_catalog
    add constraint milestone_catalog_xp_reward_check check (xp_reward >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.milestone_catalog
    add constraint milestone_catalog_progress_weight_check check (progress_weight between 1 and 100);
exception when duplicate_object then null; end $$;

-- Preserve stable rows where the old catalog is an unambiguous equivalent.
update public.milestone_catalog
set slug = 'required_courses_completed',
    updated_at = now()
where slug = 'courses'
  and not exists (select 1 from public.milestone_catalog where slug = 'required_courses_completed');

update public.milestone_catalog
set slug = 'defence_completed',
    updated_at = now()
where slug = 'defence'
  and not exists (select 1 from public.milestone_catalog where slug = 'defence_completed');

-- Retire every old core entry before restoring the canonical active set.
update public.milestone_catalog
set active = false,
    is_core_journey = false,
    updated_at = now();

insert into public.milestone_catalog
  (slug, title, description, icon_key, progress_weight, xp_reward, is_automatic, is_core_journey, active, sort_order, updated_at)
values
  ('phd_started_voluntarily', 'PhD Started (Voluntarily)', 'You signed up for this. On purpose.', '🌱', 10, 0, true, true, true, 1, now()),
  ('required_courses_completed', 'Required Courses Completed', 'The coursework is done. You may now return to your regularly scheduled research.', '🎓', 10, 500, false, true, true, 2, now()),
  ('conference_presentation', 'Conference Presentation', 'You presented your research to a room full of academics and survived the questions.', '🎤', 10, 600, false, true, true, 3, now()),
  ('journal_paper_1_published', 'Journal Paper #1 Published', 'Your first thesis-related first-author journal paper made it into the literature.', '📖', 10, 1000, false, true, true, 4, now()),
  ('journal_paper_2_published', 'Journal Paper #2 Published', 'Two thesis-related first-author journal papers. Publication requirement complete.', '📚', 10, 1250, false, true, true, 5, now()),
  ('preliminary_defence', 'Preliminary Defence', 'You survived the rehearsal boss fight.', '🛡️', 10, 900, false, true, true, 6, now()),
  ('thesis_written', 'Thesis Written', 'The thesis exists. All of it.', '📘', 20, 1500, false, true, true, 7, now()),
  ('defence_completed', 'Defence Completed', 'Final boss defeated.', '🏆', 20, 2000, false, true, true, 8, now())
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  icon_key = excluded.icon_key,
  progress_weight = excluded.progress_weight,
  xp_reward = excluded.xp_reward,
  is_automatic = excluded.is_automatic,
  is_core_journey = excluded.is_core_journey,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Preserve the existing meaningful milestone rewards and make them reproducible
-- on a clean database as well as on an upgraded one.
with reward_seed(slug, name, milestone_slug, sort_order) as (values
  ('milestone-courses-scholar', 'Coursework Survivor', 'required_courses_completed', 1001),
  ('milestone-defence-doctor-technically', 'Doctor, Technically', 'defence_completed', 1002),
  ('milestone-defence-doctor-actually', 'Doctor, Actually', 'defence_completed', 1003)
)
insert into public.titles(slug, name, source, milestone_id, sort_order, active)
select r.slug, r.name, 'milestone', m.id, r.sort_order, true
from reward_seed r
join public.milestone_catalog m on m.slug = r.milestone_slug
on conflict (slug) do update set
  name = excluded.name,
  source = 'milestone',
  required_level = null,
  milestone_id = excluded.milestone_id,
  achievement_id = null,
  sort_order = excluded.sort_order,
  active = true,
  updated_at = now();

insert into public.milestone_title_rewards(milestone_id, title_id)
select t.milestone_id, t.id
from public.titles t
where t.source = 'milestone' and t.active and t.milestone_id is not null
  and t.slug in ('milestone-courses-scholar', 'milestone-defence-doctor-technically', 'milestone-defence-doctor-actually')
on conflict do nothing;

-- Old reward mappings for retired milestones must not remain active. The existing
-- coursework and defence mappings survive because their rows were renamed above.
delete from public.milestone_title_rewards r
where exists (
  select 1
  from public.milestone_catalog m
  where m.id = r.milestone_id
    and (not m.is_core_journey or not m.active)
);

update public.titles t
set active = false,
    updated_at = now()
where t.source = 'milestone'
  and t.milestone_id is not null
  and exists (
    select 1 from public.milestone_catalog m
    where m.id = t.milestone_id and (not m.is_core_journey or not m.active)
  );

do $$
declare v_total integer;
begin
  select coalesce(sum(progress_weight), 0) into v_total
  from public.milestone_catalog
  where active and is_core_journey;
  if v_total <> 100 then
    raise exception 'Canonical PhD Journey progress must total 100, got %', v_total;
  end if;
end $$;

create index if not exists milestone_catalog_core_sort_idx
  on public.milestone_catalog(is_core_journey, active, sort_order);

-- The first milestone is awarded by account creation and by an idempotent
-- existing-user backfill. It has no XP ledger entry because its XP reward is zero.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_milestone_id uuid;
begin
  insert into public.profiles(id, username)
  values (new.id, 'research_' || substr(replace(new.id::text,'-',''),1,7));
  insert into public.player_state(user_id) values (new.id);
  perform public.unlock_level_titles(new.id, 1);
  select id into v_milestone_id
  from public.milestone_catalog
  where slug = 'phd_started_voluntarily' and active and is_core_journey and is_automatic;
  if v_milestone_id is not null then
    insert into public.user_milestones(user_id, milestone_id, completed_at)
    values (new.id, v_milestone_id, now())
    on conflict (user_id, milestone_id) do nothing;
  end if;
  return new;
end; $$;

insert into public.user_milestones(user_id, milestone_id, completed_at)
select p.id, m.id, coalesce(p.created_at, now())
from public.profiles p
join public.player_state s on s.user_id = p.id
join public.milestone_catalog m on m.slug = 'phd_started_voluntarily'
where m.active and m.is_core_journey and m.is_automatic
on conflict (user_id, milestone_id) do nothing;

-- One authoritative read for the Journey screen. Progress is calculated only
-- from active core milestones and their configured weights.
drop function if exists public.get_journey_snapshot();
create or replace function public.get_journey_snapshot()
returns jsonb language sql security definer set search_path = public
as $$
  with journey as (
    select m.id, m.slug, m.title, m.description, m.icon_key, m.progress_weight,
      m.xp_reward, m.is_automatic, m.is_core_journey, m.sort_order,
      (um.completed_at is not null) as completed
    from public.milestone_catalog m
    left join public.user_milestones um
      on um.milestone_id = m.id and um.user_id = auth.uid()
    where m.active and m.is_core_journey
  )
  select jsonb_build_object(
    'milestones', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'slug', slug, 'title', title, 'description', description,
      'iconKey', icon_key, 'progressPercent', progress_weight, 'xpReward', xp_reward,
      'isAutomatic', is_automatic, 'isCoreJourney', is_core_journey,
      'sortOrder', sort_order, 'completed', completed
    ) order by sort_order) from journey), '[]'::jsonb),
    'completedCount', (select count(*)::integer from journey where completed),
    'totalCount', (select count(*)::integer from journey),
    'progressPercent', least(100, coalesce((select sum(progress_weight)::integer from journey where completed), 0))
  );
$$;
revoke all on function public.get_journey_snapshot() from public;
grant execute on function public.get_journey_snapshot() to authenticated;

-- Completion is one-way and idempotent. The automatic first milestone cannot be
-- changed through the normal Journey flow, and every other milestone awards its
-- configured XP through the authoritative XP ledger exactly once.
create or replace function public.toggle_milestone(p_milestone_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_milestone public.milestone_catalog%rowtype;
  v_completed boolean;
  v_inserted integer;
  v_before integer;
  v_total integer;
  v_level integer;
  v_previous_level integer;
  v_achievement_result jsonb;
  v_titles jsonb := '[]'::jsonb;
  v_achievement_xp integer := 0;
  v_title record;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into v_milestone
  from public.milestone_catalog
  where id = p_milestone_id and active and is_core_journey;
  if not found then raise exception 'Milestone unavailable'; end if;
  if v_milestone.is_automatic then raise exception 'Automatic milestone cannot be changed'; end if;

  select completed_at is not null into v_completed
  from public.user_milestones
  where user_id = auth.uid() and milestone_id = p_milestone_id
  for update;

  select total_xp into v_total
  from public.player_state
  where user_id = auth.uid()
  for update;
  if v_total is null then raise exception 'Player state unavailable'; end if;
  if coalesce(v_completed, false) then
    select coalesce(max(level), 1) into v_level
    from public.level_thresholds where total_xp_required <= v_total;
    return jsonb_build_object(
      'completed', true, 'alreadyCompleted', true,
      'milestone', jsonb_build_object('id', v_milestone.id, 'slug', v_milestone.slug, 'title', v_milestone.title),
      'xpAwarded', 0, 'xpGained', 0, 'achievementXpAwarded', 0,
      'totalXp', v_total, 'previousLevel', v_level, 'currentLevel', v_level, 'level', v_level,
      'levelUp', false, 'unlockedTitles', '[]'::jsonb, 'unlockedAchievements', '[]'::jsonb
    );
  end if;

  insert into public.user_milestones(user_id, milestone_id, completed_at)
  values (auth.uid(), p_milestone_id, now())
  on conflict (user_id, milestone_id) do update set completed_at = excluded.completed_at;

  v_before := v_total;
  insert into public.xp_ledger(user_id, source_type, source_id, amount, source_key)
  values (auth.uid(), 'milestone', v_milestone.id, v_milestone.xp_reward, 'milestone:' || v_milestone.id::text)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 1 and v_milestone.xp_reward > 0 then
    update public.player_state
    set total_xp = total_xp + v_milestone.xp_reward, updated_at = now()
    where user_id = auth.uid();
  end if;

  select total_xp into v_total from public.player_state where user_id = auth.uid();
  select coalesce(max(level), 1) into v_previous_level from public.level_thresholds where total_xp_required <= v_before;
  select coalesce(max(level), 1) into v_level from public.level_thresholds where total_xp_required <= v_total;
  v_titles := public.unlock_level_titles(auth.uid(), v_level);
  v_achievement_result := public.evaluate_achievements(auth.uid());
  v_achievement_xp := coalesce((v_achievement_result->>'xpAwarded')::integer, 0);
  v_titles := coalesce(v_titles, '[]'::jsonb) || coalesce(v_achievement_result->'titles', '[]'::jsonb);
  select total_xp into v_total from public.player_state where user_id = auth.uid();
  select coalesce(max(level), 1) into v_level from public.level_thresholds where total_xp_required <= v_total;
  v_titles := v_titles || public.unlock_level_titles(auth.uid(), v_level);

  return jsonb_build_object(
    'completed', true, 'alreadyCompleted', false,
    'milestone', jsonb_build_object('id', v_milestone.id, 'slug', v_milestone.slug, 'title', v_milestone.title),
    'xpAwarded', case when v_inserted = 1 then v_milestone.xp_reward else 0 end,
    'xpGained', case when v_inserted = 1 then v_milestone.xp_reward else 0 end + v_achievement_xp,
    'achievementXpAwarded', v_achievement_xp,
    'totalXp', v_total, 'previousLevel', v_previous_level, 'currentLevel', v_level, 'level', v_level,
    'levelUp', v_level > v_previous_level,
    'unlockedTitles', v_titles,
    'unlockedAchievements', coalesce(v_achievement_result->'achievements', '[]'::jsonb)
  );
end;
$$;
revoke all on function public.toggle_milestone(uuid) from public;
grant execute on function public.toggle_milestone(uuid) to authenticated;

-- The automatic first milestone is visible in progress but is not shareable.
create or replace function public.share_milestone(p_milestone_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_milestone public.milestone_catalog%rowtype; v_activity uuid; v_inserted integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select m.* into v_milestone
  from public.milestone_catalog m
  join public.user_milestones um on um.milestone_id = m.id
  where m.id = p_milestone_id and m.active and m.is_core_journey and not m.is_automatic
    and um.user_id = auth.uid() and um.completed_at is not null;
  if not found then raise exception 'Milestone is not shareable'; end if;
  insert into public.shared_activity(user_id, source_type, source_id, metadata)
  values (auth.uid(), 'milestone', p_milestone_id, jsonb_build_object('title', v_milestone.title, 'flavorText', v_milestone.description))
  on conflict (user_id, source_type, source_id) do nothing returning id into v_activity;
  get diagnostics v_inserted = row_count;
  if v_activity is null then
    select id into v_activity from public.shared_activity
    where user_id = auth.uid() and source_type = 'milestone' and source_id = p_milestone_id;
  end if;
  return jsonb_build_object('shared', v_inserted = 1, 'activityId', v_activity);
end; $$;
revoke all on function public.share_milestone(uuid) from public;
grant execute on function public.share_milestone(uuid) to authenticated;
