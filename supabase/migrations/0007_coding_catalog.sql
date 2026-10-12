-- Canonical Coding catalogue. Run after 0006_research_catalog.sql.

insert into public.task_categories(slug, name, icon_key, sort_order)
values ('coding', 'Coding', '💻', 4)
on conflict (slug) do update set
  name = excluded.name,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order;

insert into public.tasks(category_id, slug, name, description, xp_reward, sanity_delta, icon_key, is_major, active, sort_order)
values
  ((select id from public.task_categories where slug = 'coding'), 'add-feature', 'Add a feature', 'Implement a useful new capability in a project.', 5, 0, '✨', false, true, 1),
  ((select id from public.task_categories where slug = 'coding'), 'create-pipeline', 'Create a pipeline', 'Build a repeatable pipeline for processing data or running work.', 10, 0, '🔌', false, true, 2),
  ((select id from public.task_categories where slug = 'coding'), 'finish-script', 'Finish a script', 'Complete and verify a script that supports the research workflow.', 10, 0, '📜', false, true, 3),
  ((select id from public.task_categories where slug = 'coding'), 'run-model', 'Run a model', 'Run a model and save the relevant output or results.', 10, 0, '🤖', false, true, 4),
  ((select id from public.task_categories where slug = 'coding'), 'setup-environment', 'Set up the environment', 'Configure the tools and dependencies needed for the project.', 10, 0, '🧰', false, true, 5),
  ((select id from public.task_categories where slug = 'coding'), 'create-interface', 'Create an interface', 'Build or substantially improve an interface for a project or tool.', 20, 0, '🖥️', false, true, 6),
  ((select id from public.task_categories where slug = 'coding'), 'develop-app', 'Develop an app', 'Develop a functioning app or a substantial application milestone.', 50, 0, '📱', true, true, 7)
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
where category_id = (select id from public.task_categories where slug = 'coding')
  and slug not in ('add-feature', 'create-pipeline', 'finish-script', 'run-model', 'setup-environment', 'create-interface', 'develop-app');
