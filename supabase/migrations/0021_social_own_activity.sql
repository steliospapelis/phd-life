-- Include the current user's shared milestones and achievements in Recent Activity.
-- The share controls already write to shared_activity, but the feed previously
-- filtered the author out entirely.

alter table public.profiles add column if not exists share_activity boolean not null default true;
alter table public.friendships add column if not exists responded_at timestamptz;
alter table public.friendships add column if not exists accepted_at timestamptz;

create table if not exists public.shared_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('achievement', 'milestone')),
  source_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  shared_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, source_type, source_id)
);
create index if not exists shared_activity_feed_idx on public.shared_activity(shared_at desc, id desc);
create index if not exists shared_activity_author_idx on public.shared_activity(user_id, shared_at desc);

create table if not exists public.lab_kudos (
  activity_id uuid not null references public.shared_activity(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(activity_id, user_id)
);
create index if not exists lab_kudos_activity_idx on public.lab_kudos(activity_id);

alter table public.shared_activity enable row level security;
alter table public.lab_kudos enable row level security;
revoke all on table public.shared_activity, public.lab_kudos from anon, authenticated;

create or replace function public.share_milestone(p_milestone_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_milestone public.milestone_catalog%rowtype; v_activity uuid; v_inserted integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select m.* into v_milestone from public.milestone_catalog m join public.user_milestones um on um.milestone_id = m.id
    where m.id = p_milestone_id and m.active and um.user_id = auth.uid() and um.completed_at is not null;
  if not found then raise exception 'Milestone is not completed'; end if;
  insert into public.shared_activity(user_id, source_type, source_id, metadata)
    values (auth.uid(), 'milestone', p_milestone_id, jsonb_build_object('title', v_milestone.title, 'flavorText', v_milestone.description))
    on conflict (user_id, source_type, source_id) do nothing returning id into v_activity;
  get diagnostics v_inserted = row_count;
  if v_activity is null then select id into v_activity from public.shared_activity where user_id = auth.uid() and source_type = 'milestone' and source_id = p_milestone_id; end if;
  return jsonb_build_object('shared', v_inserted = 1, 'activityId', v_activity);
end; $$;
revoke all on function public.share_milestone(uuid) from public;
grant execute on function public.share_milestone(uuid) to authenticated;

create or replace function public.share_achievement(p_achievement_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_achievement public.achievement_catalog%rowtype; v_activity uuid; v_inserted integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select a.* into v_achievement from public.achievement_catalog a join public.user_achievements ua on ua.achievement_id = a.id
    where a.id = p_achievement_id and a.active and ua.user_id = auth.uid();
  if not found then raise exception 'Achievement is not unlocked'; end if;
  insert into public.shared_activity(user_id, source_type, source_id, metadata)
    values (auth.uid(), 'achievement', p_achievement_id, jsonb_build_object('title', v_achievement.name, 'flavorText', v_achievement.description))
    on conflict (user_id, source_type, source_id) do nothing returning id into v_activity;
  get diagnostics v_inserted = row_count;
  if v_activity is null then select id into v_activity from public.shared_activity where user_id = auth.uid() and source_type = 'achievement' and source_id = p_achievement_id; end if;
  return jsonb_build_object('shared', v_inserted = 1, 'activityId', v_activity);
end; $$;
revoke all on function public.share_achievement(uuid) from public;
grant execute on function public.share_achievement(uuid) to authenticated;

drop function if exists public.get_social_bootstrap();
drop function if exists public.get_social_bootstrap(integer, timestamptz);
create or replace function public.get_social_bootstrap(p_limit integer default 15, p_before timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_limit integer := least(greatest(coalesce(p_limit, 15), 1), 50);
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  return (
    with ordered as (
      select sa.id, sa.user_id, sa.source_type, sa.source_id, sa.metadata, sa.shared_at, p.username, p.avatar,
        (select count(*)::integer from public.lab_kudos lk where lk.activity_id = sa.id) as citation_count,
        (select coalesce(jsonb_agg(jsonb_build_object('id', cp.id, 'username', cp.username, 'avatar', cp.avatar) order by lk.created_at desc), '[]'::jsonb)
          from public.lab_kudos lk
          join public.profiles cp on cp.id = lk.user_id
          where lk.activity_id = sa.id) as citation_users,
        exists (select 1 from public.lab_kudos lk where lk.activity_id = sa.id and lk.user_id = auth.uid()) as user_has_citation
      from public.shared_activity sa
      join public.profiles p on p.id = sa.user_id
      where p.share_activity
        and (sa.user_id = auth.uid() or exists (select 1 from public.friendships f where f.status = 'accepted' and ((f.requester_id = auth.uid() and f.addressee_id = sa.user_id) or (f.addressee_id = auth.uid() and f.requester_id = sa.user_id))))
        and (p_before is null or sa.shared_at < p_before)
        and ((sa.source_type = 'milestone' and exists (select 1 from public.user_milestones um where um.user_id = sa.user_id and um.milestone_id = sa.source_id and um.completed_at is not null)) or (sa.source_type = 'achievement' and exists (select 1 from public.user_achievements ua where ua.user_id = sa.user_id and ua.achievement_id = sa.source_id)))
      order by sa.shared_at desc, sa.id desc
      limit (v_limit + 1)
    ), page as (select * from ordered limit v_limit)
    select jsonb_build_object(
      'friends', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'username', p.username, 'title', coalesce((select t.name from public.titles t where t.id = p.selected_title_id), 'Promising Research Organism'), 'phdYear', p.phd_year, 'level', coalesce((select max(l.level)::integer from public.level_thresholds l where l.total_xp_required <= coalesce(ps.total_xp, 0)), 1), 'totalXp', coalesce(ps.total_xp, 0), 'sanity', ps.sanity, 'avatar', p.avatar, 'achievementNames', '[]'::jsonb, 'milestoneNames', '[]'::jsonb, 'friendsSince', to_char(coalesce(f.accepted_at, f.created_at) at time zone 'Europe/Athens', 'FMMonth DD, YYYY'), 'acceptedAt', coalesce(f.accepted_at, f.created_at)) order by lower(p.username)) from public.friendships f join public.profiles p on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end join public.player_state ps on ps.user_id = p.id where f.status = 'accepted' and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())), '[]'::jsonb),
      'requests', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'createdAt', f.created_at, 'from', jsonb_build_object('id', p.id, 'username', p.username, 'title', coalesce((select t.name from public.titles t where t.id = p.selected_title_id), 'Promising Research Organism'), 'phdYear', p.phd_year, 'level', coalesce((select max(l.level)::integer from public.level_thresholds l where l.total_xp_required <= coalesce(ps.total_xp, 0)), 1), 'avatar', p.avatar, 'achievementNames', '[]'::jsonb, 'milestoneNames', '[]'::jsonb, 'friendsSince', '')) order by f.created_at desc) from public.friendships f join public.profiles p on p.id = f.requester_id join public.player_state ps on ps.user_id = p.id where f.addressee_id = auth.uid() and f.status = 'pending'), '[]'::jsonb),
      'events', coalesce((select jsonb_agg(jsonb_build_object('id', page.id, 'userId', page.user_id, 'username', page.username, 'avatar', page.avatar, 'type', page.source_type, 'sourceId', page.source_id, 'createdAt', page.shared_at, 'sharedAt', page.shared_at, 'metadata', page.metadata, 'reactions', jsonb_build_object('citation', page.citation_count), 'citationCount', page.citation_count, 'citationUsers', page.citation_users, 'userHasCitation', page.user_has_citation) order by page.shared_at desc, page.id desc) from page), '[]'::jsonb),
      'nextCursor', (select to_jsonb(ordered.shared_at) from ordered offset v_limit limit 1)
    )
  );
end; $$;
revoke all on function public.get_social_bootstrap(integer, timestamptz) from public;
grant execute on function public.get_social_bootstrap(integer, timestamptz) to authenticated;

-- Allow the author to cite their own shared activity too. The feed uses the
-- same Strava-style citation payload for both friends and the current user.
create or replace function public.toggle_lab_citation(p_activity_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_owner uuid;
  v_active boolean;
  v_count integer;
  v_achievement_result jsonb;
  v_total integer;
  v_level integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select sa.user_id into v_owner
  from public.shared_activity sa
  where sa.id = p_activity_id
    and (sa.user_id = auth.uid() or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = sa.user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = sa.user_id))
    ))
    and ((sa.source_type = 'milestone' and exists (
      select 1 from public.user_milestones um
      where um.user_id = sa.user_id and um.milestone_id = sa.source_id and um.completed_at is not null
    )) or (sa.source_type = 'achievement' and exists (
      select 1 from public.user_achievements ua
      where ua.user_id = sa.user_id and ua.achievement_id = sa.source_id
    )));
  if v_owner is null then raise exception 'Activity unavailable'; end if;

  if exists (select 1 from public.lab_kudos where activity_id = p_activity_id and user_id = auth.uid()) then
    delete from public.lab_kudos where activity_id = p_activity_id and user_id = auth.uid();
    v_active := false;
  else
    insert into public.lab_kudos(activity_id, user_id) values (p_activity_id, auth.uid());
    v_active := true;
  end if;

  select count(*)::integer into v_count from public.lab_kudos where activity_id = p_activity_id;
  v_achievement_result := public.evaluate_achievements(auth.uid());
  select total_xp into v_total from public.player_state where user_id = auth.uid();
  select coalesce(max(level), 1) into v_level
  from public.level_thresholds where total_xp_required <= v_total;

  return jsonb_build_object(
    'active', v_active,
    'count', v_count,
    'achievementXpAwarded', coalesce((v_achievement_result->>'xpAwarded')::integer, 0),
    'unlockedAchievements', coalesce(v_achievement_result->'achievements', '[]'::jsonb),
    'totalXp', v_total,
    'level', v_level
  );
end;
$$;
revoke all on function public.toggle_lab_citation(uuid) from public;
grant execute on function public.toggle_lab_citation(uuid) to authenticated;
