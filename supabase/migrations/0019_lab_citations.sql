-- Replace the user-facing Lab Kudos reaction with Strava-style citations.
-- The existing lab_kudos table is retained internally so existing data stays intact.

create or replace function public.toggle_lab_citation(p_activity_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_owner uuid; v_active boolean; v_count integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select sa.user_id into v_owner from public.shared_activity sa
    where sa.id = p_activity_id
      and sa.user_id <> auth.uid()
      and exists (select 1 from public.friendships f where f.status = 'accepted' and ((f.requester_id = auth.uid() and f.addressee_id = sa.user_id) or (f.addressee_id = auth.uid() and f.requester_id = sa.user_id)))
      and ((sa.source_type = 'milestone' and exists (select 1 from public.user_milestones um where um.user_id = sa.user_id and um.milestone_id = sa.source_id and um.completed_at is not null)) or (sa.source_type = 'achievement' and exists (select 1 from public.user_achievements ua where ua.user_id = sa.user_id and ua.achievement_id = sa.source_id)));
  if v_owner is null then raise exception 'Activity unavailable'; end if;
  if exists (select 1 from public.lab_kudos where activity_id = p_activity_id and user_id = auth.uid()) then
    delete from public.lab_kudos where activity_id = p_activity_id and user_id = auth.uid(); v_active := false;
  else
    insert into public.lab_kudos(activity_id, user_id) values (p_activity_id, auth.uid()); v_active := true;
  end if;
  select count(*)::integer into v_count from public.lab_kudos where activity_id = p_activity_id;
  return jsonb_build_object('active', v_active, 'count', v_count);
end; $$;
revoke all on function public.toggle_lab_citation(uuid) from public;
grant execute on function public.toggle_lab_citation(uuid) to authenticated;

-- Keep the old RPC available for older clients while the app moves to citations.
create or replace function public.toggle_lab_kudos(p_activity_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$ begin return public.toggle_lab_citation(p_activity_id); end; $$;
revoke all on function public.toggle_lab_kudos(uuid) from public;
grant execute on function public.toggle_lab_kudos(uuid) to authenticated;

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
        exists (select 1 from public.lab_kudos lk where lk.activity_id = sa.id and lk.user_id = auth.uid()) as user_has_citation,
        (select coalesce(jsonb_agg(jsonb_build_object('id', cp.id, 'username', cp.username, 'avatar', cp.avatar) order by lk.created_at desc), '[]'::jsonb)
          from public.lab_kudos lk join public.profiles cp on cp.id = lk.user_id where lk.activity_id = sa.id) as citation_users
      from public.shared_activity sa
      join public.profiles p on p.id = sa.user_id
      where sa.user_id <> auth.uid()
        and (p_before is null or sa.shared_at < p_before)
        and exists (select 1 from public.friendships f where f.status = 'accepted' and ((f.requester_id = auth.uid() and f.addressee_id = sa.user_id) or (f.addressee_id = auth.uid() and f.requester_id = sa.user_id)))
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
