-- Canonical Academic catalogue. Run after 0008_experiments_catalog.sql.

insert into public.task_categories(slug, name, icon_key, sort_order)
values ('academic', 'Academic', '🎓', 6)
on conflict (slug) do update set
  name = excluded.name,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order;

insert into public.tasks(category_id, slug, name, description, xp_reward, sanity_delta, icon_key, is_major, active, sort_order)
values
  ((select id from public.task_categories where slug = 'academic'), 'attend-class', 'Attend a class', 'Attend a class that supports your academic or research progress.', 5, 0, '📚', false, true, 1),
  ((select id from public.task_categories where slug = 'academic'), 'seminar', 'Attend a seminar', 'Attend a seminar and take away one useful idea or connection.', 10, 0, '🎤', false, true, 2),
  ((select id from public.task_categories where slug = 'academic'), 'network-researcher', 'Network with another researcher', 'Make a meaningful academic connection with another researcher.', 10, 0, '🤝', false, true, 3),
  ((select id from public.task_categories where slug = 'academic'), 'attend-conference', 'Attend a conference', 'Attend a conference and engage with its academic programme.', 20, 0, '🎟️', false, true, 4),
  ((select id from public.task_categories where slug = 'academic'), 'review-paper', 'Review a paper', 'Complete a thoughtful review of an academic paper.', 20, 0, '🧐', false, true, 5),
  ((select id from public.task_categories where slug = 'academic'), 'pass-exam', 'Pass an exam', 'Pass an exam or formal academic assessment.', 50, 0, '📝', true, true, 6),
  ((select id from public.task_categories where slug = 'academic'), 'submit-proposal', 'Submit a proposal', 'Submit a research, conference, or academic proposal.', 50, 0, '📨', true, true, 7),
  ((select id from public.task_categories where slug = 'academic'), 'present-in-conference', 'Present in a conference', 'Present your work at an academic conference.', 100, 0, '🌟', true, true, 8)
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
where category_id = (select id from public.task_categories where slug = 'academic')
  and slug not in ('attend-class', 'seminar', 'network-researcher', 'attend-conference', 'review-paper', 'pass-exam', 'submit-proposal', 'present-in-conference');
