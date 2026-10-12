-- Canonical Research catalogue. Run after 0005_writing_catalog.sql.

insert into public.task_categories(slug, name, icon_key, sort_order)
values ('research', 'Research', '🔬', 1)
on conflict (slug) do update set
  name = excluded.name,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order;

insert into public.tasks(category_id, slug, name, description, xp_reward, sanity_delta, icon_key, is_major, active, sort_order)
values
  ((select id from public.task_categories where slug = 'research'), 'research-question', 'Define a research question', 'Turn a broad curiosity into a focused, answerable research question.', 10, 0, '🔎', false, true, 1),
  ((select id from public.task_categories where slug = 'research'), 'search-strategy', 'Plan a literature search', 'Choose search terms, sources, and a workable search strategy.', 10, 0, '🧭', false, true, 2),
  ((select id from public.task_categories where slug = 'research'), 'clean-dataset', 'Clean a dataset', 'Prepare a dataset by checking, correcting, and documenting its data.', 20, 0, '🧹', false, true, 3),
  ((select id from public.task_categories where slug = 'research'), 'create-questionnaire', 'Create a questionnaire', 'Draft a clear questionnaire or survey instrument for data collection.', 20, 0, '📝', false, true, 4),
  ((select id from public.task_categories where slug = 'research'), 'interpret-results', 'Interpret results', 'Explain what the results mean in relation to the research question.', 20, 0, '💡', false, true, 5),
  ((select id from public.task_categories where slug = 'research'), 'design-protocol', 'Design a study protocol', 'Define the procedures, measures, and safeguards for a study.', 25, 0, '🧠', false, true, 6),
  ((select id from public.task_categories where slug = 'research'), 'complete-data-collection', 'Complete data collection', 'Finish the planned collection of participants, samples, or observations.', 30, 0, '🗃️', false, true, 7),
  ((select id from public.task_categories where slug = 'research'), 'statistical-analysis', 'Perform a statistical analysis', 'Run the planned statistical analysis and save the resulting output.', 30, 0, '📊', false, true, 8),
  ((select id from public.task_categories where slug = 'research'), 'confirm-hypothesis', 'Confirm a hypothesis', 'Reach evidence-based support for the working research hypothesis.', 50, 0, '✅', true, true, 9)
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
where category_id = (select id from public.task_categories where slug = 'research')
  and slug not in ('research-question', 'search-strategy', 'clean-dataset', 'create-questionnaire', 'interpret-results', 'design-protocol', 'complete-data-collection', 'statistical-analysis', 'confirm-hypothesis');
