-- Social redesign: private friend discovery, meaningful events, and safe reactions.

alter table public.profiles add column if not exists share_activity boolean not null default true;
alter table public.social_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.social_events add column if not exists source_type text;
alter table public.social_events add column if not exists source_id uuid;

alter table public.social_reactions drop constraint if exists social_reactions_reaction_check;
alter table public.social_reactions add constraint social_reactions_reaction_check check (reaction in ('👏', '🫡', '💀', '🔬', '☕'));
create unique index if not exists social_events_source_unique on public.social_events(source_type, source_id) where source_type is not null and source_id is not null;

-- Keep profile search deliberately narrow. Email, player state, sanity, and task history
-- never leave this function.
create or replace function public.search_users_by_username(p_query text)
returns table(user_id uuid, username text, avatar jsonb, selected_title text, phd_year smallint, friendship_status text)
language sql security definer set search_path = public
as $$
  select p.id, p.username, p.avatar,
    coalesce((select t.name from public.titles t where t.id = p.selected_title_id), 'Promising Research Organism'),
    p.phd_year,
    case
      when exists (select 1 from public.friendships f where f.status = 'accepted' and ((f.requester_id = auth.uid() and f.addressee_id = p.id) or (f.addressee_id = auth.uid() and f.requester_id = p.id))) then 'friends'
      when exists (select 1 from public.friendships f where f.status = 'pending' and f.requester_id = auth.uid() and f.addressee_id = p.id) then 'requested'
      when exists (select 1 from public.friendships f where f.status = 'pending' and f.requester_id = p.id and f.addressee_id = auth.uid()) then 'incoming'
      else 'add'
    end
  from public.profiles p
  where auth.uid() is not null and p.id <> auth.uid() and p.onboarding_complete = true
    and lower(p.username) like '%' || lower(btrim(p_query)) || '%'
  order by lower(p.username)
  limit 20;
$$;
revoke all on function public.search_users_by_username(text) from public;
grant execute on function public.search_users_by_username(text) to authenticated;

create or replace function public.send_friend_request(p_addressee_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null or p_addressee_id = auth.uid() then raise exception 'Invalid friend request'; end if;
  if not exists (select 1 from public.profiles where id = p_addressee_id and onboarding_complete = true) then raise exception 'User unavailable'; end if;
  if exists (select 1 from public.friendships f where f.status = 'accepted' and ((f.requester_id = auth.uid() and f.addressee_id = p_addressee_id) or (f.addressee_id = auth.uid() and f.requester_id = p_addressee_id))) then raise exception 'Already friends'; end if;
  if exists (select 1 from public.friendships f where f.status = 'pending' and ((f.requester_id = auth.uid() and f.addressee_id = p_addressee_id) or (f.requester_id = p_addressee_id and f.addressee_id = auth.uid()))) then raise exception 'Request already exists'; end if;
  insert into public.friendships(requester_id, addressee_id, status) values (auth.uid(), p_addressee_id, 'pending') returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.send_friend_request(uuid) from public;
grant execute on function public.send_friend_request(uuid) to authenticated;

create or replace function public.respond_to_friend_request(p_friendship_id uuid, p_accept boolean)
returns boolean language plpgsql security definer set search_path = public
as $$
begin
  update public.friendships set status = case when p_accept then 'accepted' else 'declined' end
  where id = p_friendship_id and addressee_id = auth.uid() and status = 'pending';
  return found;
end; $$;
revoke all on function public.respond_to_friend_request(uuid, boolean) from public;
grant execute on function public.respond_to_friend_request(uuid, boolean) to authenticated;

create or replace function public.remove_friend(p_friend_id uuid)
returns boolean language plpgsql security definer set search_path = public
as $$
begin
  delete from public.friendships
  where status = 'accepted' and ((requester_id = auth.uid() and addressee_id = p_friend_id) or (addressee_id = auth.uid() and requester_id = p_friend_id));
  return found;
end; $$;
revoke all on function public.remove_friend(uuid) from public;
grant execute on function public.remove_friend(uuid) to authenticated;

create or replace function public.react_to_social_event(p_event_id uuid, p_reaction text)
returns boolean language plpgsql security definer set search_path = public
as $$
declare v_owner uuid;
begin
  if p_reaction is not null and p_reaction not in ('👏', '🫡', '💀', '🔬', '☕') then raise exception 'Reaction unavailable'; end if;
  select e.user_id into v_owner from public.social_events e where e.id = p_event_id and (e.user_id = auth.uid() or exists (select 1 from public.friendships f where f.status = 'accepted' and ((f.requester_id = auth.uid() and f.addressee_id = e.user_id) or (f.addressee_id = auth.uid() and f.requester_id = e.user_id))));
  if v_owner is null then raise exception 'Event unavailable'; end if;
  if p_reaction is null then delete from public.social_reactions where event_id = p_event_id and user_id = auth.uid();
  else insert into public.social_reactions(event_id, user_id, reaction) values (p_event_id, auth.uid(), p_reaction) on conflict (event_id, user_id) do update set reaction = excluded.reaction, created_at = now(); end if;
  return true;
end; $$;
revoke all on function public.react_to_social_event(uuid, text) from public;
grant execute on function public.react_to_social_event(uuid, text) to authenticated;

create or replace function public.set_social_sharing(p_enabled boolean)
returns void language sql security definer set search_path = public
as $$ update public.profiles set share_activity = p_enabled, updated_at = now() where id = auth.uid(); $$;
revoke all on function public.set_social_sharing(boolean) from public;
grant execute on function public.set_social_sharing(boolean) to authenticated;

-- Feed-ready bootstrap. The row-level policy remains the final privacy boundary,
-- while this function avoids profile/event/reaction N+1 queries in the client.
create or replace function public.get_social_bootstrap()
returns jsonb language sql security definer set search_path = public
as $$
select jsonb_build_object(
  'friends', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'username', p.username, 'title', coalesce((select t.name from public.titles t where t.id = p.selected_title_id), 'Promising Research Organism'), 'phdYear', p.phd_year, 'avatar', p.avatar, 'achievementNames', '[]'::jsonb, 'milestoneNames', '[]'::jsonb, 'friendsSince', to_char(f.created_at at time zone 'Europe/Athens', 'FMMonth YYYY')) order by lower(p.username)) from public.friendships f join public.profiles p on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end where f.status = 'accepted' and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())), '[]'::jsonb),
  'requests', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'createdAt', f.created_at, 'from', jsonb_build_object('id', p.id, 'username', p.username, 'title', coalesce((select t.name from public.titles t where t.id = p.selected_title_id), 'Promising Research Organism'), 'phdYear', p.phd_year, 'avatar', p.avatar, 'achievementNames', '[]'::jsonb, 'milestoneNames', '[]'::jsonb, 'friendsSince', to_char(f.created_at at time zone 'Europe/Athens', 'FMMonth YYYY'))) order by f.created_at desc) from public.friendships f join public.profiles p on p.id = f.requester_id where f.addressee_id = auth.uid() and f.status = 'pending'), '[]'::jsonb),
  'events', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'userId', e.user_id, 'username', p.username, 'avatar', p.avatar, 'type', e.event_type, 'createdAt', e.created_at, 'metadata', e.metadata, 'reactions', coalesce((select jsonb_object_agg(r.reaction, r.count) from (select reaction, count(*)::integer as count from public.social_reactions where event_id = e.id group by reaction) r), '{}'::jsonb)) order by e.created_at desc) from public.social_events e join public.profiles p on p.id = e.user_id where p.share_activity = true and (e.user_id = auth.uid() or exists (select 1 from public.friendships f where f.status = 'accepted' and ((f.requester_id = auth.uid() and f.addressee_id = e.user_id) or (f.addressee_id = auth.uid() and f.requester_id = e.user_id)))) limit 20), '[]'::jsonb)
);
$$;
revoke all on function public.get_social_bootstrap() from public;
grant execute on function public.get_social_bootstrap() to authenticated;

create or replace function public.publish_major_task_social_event()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_task public.tasks%rowtype; v_profile public.profiles%rowtype; v_event_type text;
begin
  select * into v_task from public.tasks where id = new.task_id;
  select * into v_profile from public.profiles where id = new.user_id;
  if not coalesce(v_task.creates_social_event, false) or not coalesce(v_profile.share_activity, true) then return new; end if;
  v_event_type := case when v_task.slug like '%conference%' then 'conference_completed' when v_task.slug like '%paper%' then 'paper_submitted' when v_task.slug like '%thesis%' then 'thesis_submitted' else 'major_research_event' end;
  insert into public.social_events(user_id, event_type, text, task_id, metadata, source_type, source_id) values (new.user_id, v_event_type, v_task.name, new.task_id, jsonb_build_object('taskName', v_task.name), 'task_log', new.id) on conflict (source_type, source_id) do nothing;
  return new;
end; $$;
drop trigger if exists task_log_social_event on public.task_logs;
create trigger task_log_social_event after insert on public.task_logs for each row execute procedure public.publish_major_task_social_event();

update public.tasks set creates_social_event = true where slug in ('confirm-hypothesis', 'finish-section', 'submit-conference-paper', 'submit-journal-paper', 'develop-app', 'pass-exam', 'submit-proposal', 'present-in-conference');
