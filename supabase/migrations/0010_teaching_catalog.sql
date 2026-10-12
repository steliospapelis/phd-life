-- Canonical Teaching catalogue. Run after 0009_academic_catalog.sql.

insert into public.task_categories(slug, name, icon_key, sort_order)
values ('teaching', 'Teaching', '🧑‍🏫', 7)
on conflict (slug) do update set
  name = excluded.name,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order;

insert into public.tasks(category_id, slug, name, description, xp_reward, sanity_delta, icon_key, is_major, active, sort_order)
values
  ((select id from public.task_categories where slug = 'teaching'), 'grade-paper', 'Grade a paper', 'Read and assess one paper or student submission.', 5, 0, '📝', false, true, 1),
  ((select id from public.task_categories where slug = 'teaching'), 'give-student-feedback', 'Give a student feedback', 'Give a student clear, constructive feedback on their work.', 10, 0, '💬', false, true, 2),
  ((select id from public.task_categories where slug = 'teaching'), 'help-labmate', 'Help a labmate', 'Support a labmate with a teaching or academic task.', 10, 0, '🤝', false, true, 3),
  ((select id from public.task_categories where slug = 'teaching'), 'help-workshop', 'Help in a workshop', 'Support the delivery of a workshop or practical session.', 10, 0, '🧑‍🏫', false, true, 4),
  ((select id from public.task_categories where slug = 'teaching'), 'prepare-lecture', 'Prepare a lecture', 'Prepare the content and materials for a lecture.', 10, 0, '📚', false, true, 5),
  ((select id from public.task_categories where slug = 'teaching'), 'supervise-exam', 'Supervise exam', 'Supervise an exam or formal assessment session.', 10, 0, '📝', false, true, 6),
  ((select id from public.task_categories where slug = 'teaching'), 'teach-class-workshop', 'Teach a class / workshop', 'Teach a class or workshop session.', 20, 0, '🏫', false, true, 7)
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
where category_id = (select id from public.task_categories where slug = 'teaching')
  and slug not in ('grade-paper', 'give-student-feedback', 'help-labmate', 'help-workshop', 'prepare-lecture', 'supervise-exam', 'teach-class-workshop');
