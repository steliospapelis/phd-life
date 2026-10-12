-- Canonical Writing catalogue. Run after 0004_reading_catalog_and_logged_xp.sql.

insert into public.task_categories(slug, name, icon_key, sort_order)
values ('writing', 'Writing', '✍️', 3)
on conflict (slug) do update set
  name = excluded.name,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order;

insert into public.tasks(category_id, slug, name, description, xp_reward, sanity_delta, icon_key, is_major, active, sort_order)
values
  ((select id from public.task_categories where slug = 'writing'), 'revise-paragraph', 'Revise a paragraph', 'Improve one paragraph for clarity, structure, or accuracy.', 5, 0, '🔧', false, true, 1),
  ((select id from public.task_categories where slug = 'writing'), 'craft-figure-table', 'Craft a figure or table', 'Create or substantially improve one figure or table.', 10, 0, '📊', false, true, 2),
  ((select id from public.task_categories where slug = 'writing'), 'prepare-abstract', 'Write the abstract', 'Draft or revise the abstract so the contribution is clear.', 10, 0, '🧾', false, true, 3),
  ((select id from public.task_categories where slug = 'writing'), 'prepare-outline', 'Prepare an outline', 'Build an outline that gives a section or paper a workable structure.', 10, 0, '🗂️', false, true, 4),
  ((select id from public.task_categories where slug = 'writing'), 'write-section', 'Write a section', 'Draft a complete section of a paper, report, or thesis.', 20, 0, '✍️', false, true, 5),
  ((select id from public.task_categories where slug = 'writing'), 'finish-section', 'Finish a thesis section', 'Bring a thesis section to a complete, reviewable state.', 100, 0, '🏁', true, true, 6),
  ((select id from public.task_categories where slug = 'writing'), 'submit-conference-paper', 'Submit a conference paper', 'Complete and submit a paper to a conference.', 300, 0, '🎤', true, true, 7),
  ((select id from public.task_categories where slug = 'writing'), 'submit-journal-paper', 'Submit a journal paper', 'Complete and submit a paper to a journal.', 500, 0, '🚀', true, true, 8)
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
where category_id = (select id from public.task_categories where slug = 'writing')
  and slug not in ('revise-paragraph', 'craft-figure-table', 'prepare-abstract', 'prepare-outline', 'write-section', 'finish-section', 'submit-conference-paper', 'submit-journal-paper');
