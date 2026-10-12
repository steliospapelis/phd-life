-- Canonical Reading catalogue and immutable XP values for historical reports.
-- Run this after 0003_task_logs_reports.sql.

insert into public.task_categories(slug, name, icon_key, sort_order)
values ('reading', 'Reading', '📖', 2)
on conflict (slug) do update set
  name = excluded.name,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order;

insert into public.tasks(category_id, slug, name, description, xp_reward, sanity_delta, icon_key, is_major, active, sort_order)
values
  ((select id from public.task_categories where slug = 'reading'), 'skim-abstract', 'Skim an abstract', 'Quickly triage a paper and decide whether it deserves a deeper read.', 2, 0, '👀', false, true, 1),
  ((select id from public.task_categories where slug = 'reading'), 'extract-citations', 'Extract useful citations', 'Capture the citations you want to find again later.', 3, 0, '🔖', false, true, 2),
  ((select id from public.task_categories where slug = 'reading'), 'read-paper', 'Read a paper', 'Read a full paper with enough attention to understand its main contribution.', 10, 0, '📚', false, true, 3),
  ((select id from public.task_categories where slug = 'reading'), 'paper-notes', 'Take paper notes', 'Record the useful ideas, methods, questions, and follow-ups from a paper.', 10, 0, '🗒️', false, true, 4),
  ((select id from public.task_categories where slug = 'reading'), 'read-book-chapter', 'Read a book chapter', 'Work through one chapter of a research or subject book.', 20, 0, '📘', false, true, 5),
  ((select id from public.task_categories where slug = 'reading'), 'identify-research-gap', 'Identify a research gap', 'Write down a specific unanswered question or limitation in the literature.', 30, 0, '💡', false, true, 6)
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  xp_reward = excluded.xp_reward,
  sanity_delta = 0,
  icon_key = excluded.icon_key,
  is_major = false,
  active = true,
  sort_order = excluded.sort_order,
  updated_at = now();

update public.tasks
set active = false, updated_at = now()
where category_id = (select id from public.task_categories where slug = 'reading')
  and slug not in ('skim-abstract', 'extract-citations', 'read-paper', 'paper-notes', 'read-book-chapter', 'identify-research-gap');

-- Store the reward at completion time so changing a task's future reward does
-- not rewrite the XP totals in historical reports.
alter table public.task_logs add column if not exists xp_awarded integer;
update public.task_logs l
set xp_awarded = t.xp_reward
from public.tasks t
where t.id = l.task_id and l.xp_awarded is null;
alter table public.task_logs alter column xp_awarded set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'task_logs_xp_awarded_positive') then
    alter table public.task_logs add constraint task_logs_xp_awarded_positive check (xp_awarded > 0);
  end if;
end;
$$;

create or replace function public.complete_task(p_task_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks%rowtype;
  v_total integer;
  v_before integer;
  v_level integer;
  v_previous_level integer;
  v_sanity integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into v_task from public.tasks where id = p_task_id and active = true;
  if not found then raise exception 'Task unavailable'; end if;
  select total_xp, sanity into v_total, v_sanity from public.player_state where user_id = auth.uid() for update;
  v_before := v_total;

  insert into public.task_logs(user_id, task_id, xp_awarded)
  values (auth.uid(), p_task_id, v_task.xp_reward);
  insert into public.xp_ledger(user_id, source_type, source_id, amount)
  values (auth.uid(), 'task', p_task_id, v_task.xp_reward);
  v_total := v_total + v_task.xp_reward;

  select coalesce(max(level), 1) into v_level
  from public.level_thresholds where total_xp_required <= v_total;
  select coalesce(max(level), 1) into v_previous_level
  from public.level_thresholds where total_xp_required <= v_before;
  update public.player_state set total_xp = v_total, updated_at = now() where user_id = auth.uid();
  perform public.evaluate_achievements(auth.uid());

  return jsonb_build_object(
    'xpAwarded', v_task.xp_reward,
    'totalXp', v_total,
    'sanity', v_sanity,
    'level', v_level,
    'levelUp', v_level > v_previous_level
  );
end;
$$;

revoke all on function public.complete_task(uuid) from public;
grant execute on function public.complete_task(uuid) to authenticated;

create or replace function public.get_activity_report(p_period text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text;
  v_today date;
  v_start date;
  v_end date;
  v_start_at timestamptz;
  v_end_at timestamptz;
  v_total_tasks integer;
  v_total_xp integer;
  v_tasks jsonb;
  v_categories jsonb;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if lower(p_period) not in ('week', 'month', 'year') then raise exception 'Unsupported report period'; end if;

  select coalesce(timezone, 'UTC') into v_timezone from public.profiles where id = auth.uid();
  v_today := (now() at time zone v_timezone)::date;
  if lower(p_period) = 'week' then
    v_start := date_trunc('week', v_today::timestamp)::date;
    v_end := v_start + 7;
  elsif lower(p_period) = 'month' then
    v_start := date_trunc('month', v_today::timestamp)::date;
    v_end := (v_start + interval '1 month')::date;
  else
    v_start := date_trunc('year', v_today::timestamp)::date;
    v_end := (v_start + interval '1 year')::date;
  end if;
  v_start_at := v_start::timestamp at time zone v_timezone;
  v_end_at := v_end::timestamp at time zone v_timezone;

  select count(l.id)::integer, coalesce(sum(l.xp_awarded), 0)::integer
    into v_total_tasks, v_total_xp
    from public.task_logs l
   where l.user_id = auth.uid() and l.created_at >= v_start_at and l.created_at < v_end_at;

  select coalesce(jsonb_agg(jsonb_build_object(
    'taskId', task_id, 'taskName', task_name, 'categoryName', category_name,
    'count', task_count, 'xp', task_xp
  ) order by task_count desc, task_name), '[]'::jsonb)
    into v_tasks
    from (
      select t.id as task_id, t.name as task_name, c.name as category_name,
             count(*)::integer as task_count, coalesce(sum(l.xp_awarded), 0)::integer as task_xp
        from public.task_logs l
        join public.tasks t on t.id = l.task_id
        join public.task_categories c on c.id = t.category_id
       where l.user_id = auth.uid() and l.created_at >= v_start_at and l.created_at < v_end_at
       group by t.id, t.name, c.name
    ) task_summary;

  select coalesce(jsonb_agg(jsonb_build_object(
    'categoryId', category_id, 'categoryName', category_name,
    'count', category_count, 'xp', category_xp
  ) order by category_count desc, category_name), '[]'::jsonb)
    into v_categories
    from (
      select c.id as category_id, c.name as category_name,
             count(*)::integer as category_count, coalesce(sum(l.xp_awarded), 0)::integer as category_xp
        from public.task_logs l
        join public.tasks t on t.id = l.task_id
        join public.task_categories c on c.id = t.category_id
       where l.user_id = auth.uid() and l.created_at >= v_start_at and l.created_at < v_end_at
       group by c.id, c.name
    ) category_summary;

  return jsonb_build_object(
    'period', lower(p_period), 'startDate', v_start, 'endDate', v_end - 1,
    'totalTasks', coalesce(v_total_tasks, 0), 'totalXp', coalesce(v_total_xp, 0),
    'taskBreakdown', v_tasks, 'categoryBreakdown', v_categories
  );
end;
$$;

revoke all on function public.get_activity_report(text) from public;
grant execute on function public.get_activity_report(text) to authenticated;
