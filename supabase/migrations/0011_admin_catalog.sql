-- Canonical Admin catalogue. Run after 0010_teaching_catalog.sql.

insert into public.task_categories(slug, name, icon_key, sort_order)
values ('admin', 'Admin', '📬', 8)
on conflict (slug) do update set
  name = excluded.name,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order;

insert into public.tasks(category_id, slug, name, description, xp_reward, sanity_delta, icon_key, is_major, active, sort_order)
values
  ((select id from public.task_categories where slug = 'admin'), 'clean-desk', 'Clean your desk', 'Clear and reset your desk or workspace.', 2, 0, '🧽', false, true, 1),
  ((select id from public.task_categories where slug = 'admin'), 'make-call', 'Make a call', 'Make an important administrative or academic call.', 2, 0, '📞', false, true, 2),
  ((select id from public.task_categories where slug = 'admin'), 'organise-files', 'Organise files', 'Organise files so the next document can actually be found.', 2, 0, '🗃️', false, true, 3),
  ((select id from public.task_categories where slug = 'admin'), 'plan-week', 'Plan the week', 'Set up a workable plan for the week ahead.', 2, 0, '🗺️', false, true, 4),
  ((select id from public.task_categories where slug = 'admin'), 'schedule-meeting', 'Schedule a meeting', 'Arrange a meeting and send the necessary details.', 2, 0, '🗓️', false, true, 5),
  ((select id from public.task_categories where slug = 'admin'), 'write-email', 'Write an email', 'Write and send an important email.', 2, 0, '📧', false, true, 6),
  ((select id from public.task_categories where slug = 'admin'), 'fill-form', 'Fill a form', 'Complete and submit an administrative form.', 3, 0, '📝', false, true, 7),
  ((select id from public.task_categories where slug = 'admin'), 'survive-supervisor-meeting', 'Survive a meeting with the supervisor', 'Make it through a supervisor meeting with your research and sanity intact.', 5, 0, '🫡', false, true, 8)
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  xp_reward = excluded.xp_reward,
  sanity_delta = 0,
  icon_key = excluded.icon_key,
  is_major = excluded.is_major,
  active = true,
  sort_order = excluded.sort_order,
  updated_at = now();

update public.tasks
set active = false, updated_at = now()
where category_id = (select id from public.task_categories where slug = 'admin')
  and slug not in ('clean-desk', 'make-call', 'organise-files', 'plan-week', 'schedule-meeting', 'write-email', 'fill-form', 'survive-supervisor-meeting');
