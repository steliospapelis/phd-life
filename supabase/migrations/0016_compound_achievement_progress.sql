-- Compound achievements show progress against the largest child target,
-- while still requiring every child rule to be complete before unlocking.
create or replace function public.achievement_rule_progress(p_user_id uuid, p_rule jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_type text := coalesce(p_rule->>'type', 'total_tasks');
  v_target integer := greatest(coalesce((p_rule->>'count')::integer, (p_rule->>'level')::integer, 1), 1);
  v_current integer := 0;
  v_unlocked boolean := false;
  v_child jsonb;
  v_child_progress jsonb;
  v_children integer := 0;
  v_min_current integer;
  v_max_target integer := 1;
begin
  if v_type = 'tag_count' then
    select count(*)::integer into v_current
    from public.task_logs l join public.task_tag_map tm on tm.task_id = l.task_id join public.task_tags tg on tg.id = tm.tag_id
    where l.user_id = p_user_id and tg.slug = p_rule->>'tag';
  elsif v_type = 'total_tasks' then
    select count(*)::integer into v_current from public.task_logs where user_id = p_user_id;
  elsif v_type = 'distinct_categories' then
    select count(distinct t.category_id)::integer into v_current from public.task_logs l join public.tasks t on t.id = l.task_id where l.user_id = p_user_id;
  elsif v_type = 'active_days' then
    select count(distinct (l.created_at at time zone coalesce((select timezone from public.profiles where id = p_user_id), 'UTC'))::date)::integer into v_current from public.task_logs l where l.user_id = p_user_id;
  elsif v_type = 'level' then
    select coalesce(max(level), 1)::integer into v_current from public.level_thresholds where total_xp_required <= coalesce((select total_xp from public.player_state where user_id = p_user_id), 0);
  elsif v_type = 'achievement_count' then
    select count(*)::integer into v_current from public.user_achievements where user_id = p_user_id;
  elsif v_type = 'milestone' then
    v_target := 1;
    select case when exists (select 1 from public.user_milestones um join public.milestone_catalog m on m.id = um.milestone_id where um.user_id = p_user_id and um.completed_at is not null and m.slug = p_rule->>'milestone_slug') then 1 else 0 end into v_current;
  elsif v_type = 'all' then
    v_min_current := null;
    for v_child in select value from jsonb_array_elements(coalesce(p_rule->'rules', '[]'::jsonb)) loop
      v_child_progress := public.achievement_rule_progress(p_user_id, v_child);
      v_max_target := greatest(v_max_target, coalesce((v_child_progress->>'target')::integer, 1));
      v_min_current := least(coalesce(v_min_current, (v_child_progress->>'current')::integer), coalesce((v_child_progress->>'current')::integer, 0));
      if coalesce((v_child_progress->>'unlocked')::boolean, false) then v_children := v_children + 1; end if;
    end loop;
    v_target := v_max_target;
    v_current := least(coalesce(v_min_current, 0), v_target);
    v_unlocked := v_children = jsonb_array_length(coalesce(p_rule->'rules', '[]'::jsonb));
    return jsonb_build_object('current', v_current, 'target', v_target, 'unlocked', v_unlocked);
  end if;
  v_unlocked := v_current >= v_target;
  return jsonb_build_object('current', v_current, 'target', v_target, 'unlocked', v_unlocked);
end;
$$;
revoke all on function public.achievement_rule_progress(uuid, jsonb) from public;
