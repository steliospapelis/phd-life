-- Canonical Experiments catalogue. Run after 0007_coding_catalog.sql.

insert into public.task_categories(slug, name, icon_key, sort_order)
values ('experiments', 'Experiments', '🧪', 5)
on conflict (slug) do update set
  name = excluded.name,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order;

insert into public.tasks(category_id, slug, name, description, xp_reward, sanity_delta, icon_key, is_major, active, sort_order)
values
  ((select id from public.task_categories where slug = 'experiments'), 'clean-lab', 'Clean the lab', 'Leave the lab or workspace ready for the next experiment.', 5, 0, '🧽', false, true, 1),
  ((select id from public.task_categories where slug = 'experiments'), 'prepare-samples', 'Prepare samples', 'Prepare the samples needed for the planned experiment.', 5, 0, '🧫', false, true, 2),
  ((select id from public.task_categories where slug = 'experiments'), 'calibrate-equipment', 'Calibrate equipment', 'Calibrate the equipment and confirm that it is ready to use.', 10, 0, '🎛️', false, true, 3),
  ((select id from public.task_categories where slug = 'experiments'), 'prepare-protocol', 'Prepare an experiment protocol', 'Prepare the steps, materials, and conditions for an experiment.', 10, 0, '📑', false, true, 4),
  ((select id from public.task_categories where slug = 'experiments'), 'record-observations', 'Record observations', 'Record observations and relevant experimental details while working.', 10, 0, '📝', false, true, 5),
  ((select id from public.task_categories where slug = 'experiments'), 'analyze-experimental-data', 'Analyze experimental data', 'Analyze data produced by an experiment and save the relevant output.', 20, 0, '📊', false, true, 6),
  ((select id from public.task_categories where slug = 'experiments'), 'perform-experiment', 'Perform an experiment', 'Complete an experiment according to its protocol.', 20, 0, '🧪', false, true, 7)
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
where category_id = (select id from public.task_categories where slug = 'experiments')
  and slug not in ('clean-lab', 'prepare-samples', 'calibrate-equipment', 'prepare-protocol', 'record-observations', 'analyze-experimental-data', 'perform-experiment');
