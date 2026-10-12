-- Content authors: edit this file or the matching rows in the Supabase dashboard.
insert into public.level_thresholds(level,total_xp_required) values (1,0),(2,100),(3,250),(4,450),(5,700),(6,1000),(7,1400),(8,1850),(9,2350),(10,2900) on conflict do nothing;

insert into public.task_categories(slug,name,icon_key,sort_order) values
('research','Research','🔬',1),('reading','Reading','📖',2),('writing','Writing','✍️',3),('coding','Coding','💻',4),('experiments','Experiments','🧪',5),('academic','Academic','🎓',6),('teaching','Teaching','🧑‍🏫',7),('admin','Admin','📬',8)
on conflict do nothing;

-- XP bands: quick admin/ritual tasks 2–12, standard work 14–30,
-- substantial milestones 32–100, and exceptional milestones 300–500.
-- Sanity is intentionally zero for every task until that mechanic is revisited.
insert into public.tasks(category_id,slug,name,xp_reward,sanity_delta,icon_key,is_major)
select c.id, x.slug, x.name, x.xp, 0, x.icon, x.major
from public.task_categories c
join (values
  ('research','research-question','Define a research question',10,'🔎',false),
  ('research','search-strategy','Plan a literature search',10,'🧭',false),
  ('research','clean-dataset','Clean a dataset',20,'🧹',false),
  ('research','create-questionnaire','Create a questionnaire',20,'📝',false),
  ('research','design-protocol','Design a study protocol',25,'🧠',false),
  ('research','complete-data-collection','Complete data collection',30,'🗃️',false),
  ('research','statistical-analysis','Perform a statistical analysis',30,'📊',false),
  ('research','interpret-results','Interpret results',20,'💡',false),
  ('research','confirm-hypothesis','Confirm a hypothesis',50,'✅',true),
  ('reading','skim-abstract','Skim an abstract',2,'👀',false),
  ('reading','extract-citations','Extract useful citations',3,'🔖',false),
  ('reading','read-paper','Read a paper',10,'📚',false),
  ('reading','paper-notes','Take paper notes',10,'🗒️',false),
  ('reading','read-book-chapter','Read a book chapter',20,'📘',false),
  ('reading','identify-research-gap','Identify a research gap',30,'💡',false),
  ('writing','revise-paragraph','Revise a paragraph',5,'🔧',false),
  ('writing','craft-figure-table','Craft a figure or table',10,'📊',false),
  ('writing','prepare-abstract','Write the abstract',10,'🧾',false),
  ('writing','prepare-outline','Prepare an outline',10,'🗂️',false),
  ('writing','write-section','Write a section',20,'✍️',false),
  ('writing','finish-section','Finish a thesis section',100,'🏁',true),
  ('writing','submit-conference-paper','Submit a conference paper',300,'🎤',true),
  ('writing','submit-journal-paper','Submit a journal paper',500,'🚀',true),
  ('coding','add-feature','Add a feature',5,'✨',false),
  ('coding','create-pipeline','Create a pipeline',10,'🔌',false),
  ('coding','finish-script','Finish a script',10,'📜',false),
  ('coding','run-model','Run a model',10,'🤖',false),
  ('coding','setup-environment','Set up the environment',10,'🧰',false),
  ('coding','create-interface','Create an interface',20,'🖥️',false),
  ('coding','develop-app','Develop an app',50,'📱',true),
  ('experiments','clean-lab','Clean the lab',5,'🧽',false),
  ('experiments','prepare-samples','Prepare samples',5,'🧫',false),
  ('experiments','calibrate-equipment','Calibrate equipment',10,'🎛️',false),
  ('experiments','prepare-protocol','Prepare an experiment protocol',10,'📑',false),
  ('experiments','record-observations','Record observations',10,'📝',false),
  ('experiments','analyze-experimental-data','Analyze experimental data',20,'📊',false),
  ('experiments','perform-experiment','Perform an experiment',20,'🧪',false),
  ('academic','attend-class','Attend a class',5,'📚',false),
  ('academic','seminar','Attend a seminar',10,'🎤',false),
  ('academic','network-researcher','Network with another researcher',10,'🤝',false),
  ('academic','attend-conference','Attend a conference',20,'🎟️',false),
  ('academic','review-paper','Review a paper',20,'🧐',false),
  ('academic','pass-exam','Pass an exam',50,'📝',true),
  ('academic','submit-proposal','Submit a proposal',50,'📨',true),
  ('academic','present-in-conference','Present in a conference',100,'🌟',true),
  ('teaching','grade-paper','Grade a paper',5,'📝',false),
  ('teaching','give-student-feedback','Give a student feedback',10,'💬',false),
  ('teaching','help-labmate','Help a labmate',10,'🤝',false),
  ('teaching','help-workshop','Help in a workshop',10,'🧑‍🏫',false),
  ('teaching','prepare-lecture','Prepare a lecture',10,'📚',false),
  ('teaching','supervise-exam','Supervise exam',10,'📝',false),
  ('teaching','teach-class-workshop','Teach a class / workshop',20,'🏫',false),
  ('admin','clean-desk','Clean your desk',2,'🧽',false),
  ('admin','make-call','Make a call',2,'📞',false),
  ('admin','organise-files','Organise files',2,'🗃️',false),
  ('admin','plan-week','Plan the week',2,'🗺️',false),
  ('admin','schedule-meeting','Schedule a meeting',2,'🗓️',false),
  ('admin','write-email','Write an email',2,'📧',false),
  ('admin','fill-form','Fill a form',3,'📝',false),
  ('admin','survive-supervisor-meeting','Survive a meeting with the supervisor',5,'🫡',false)
) as x(cat,slug,name,xp,icon,major) on c.slug = x.cat
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  xp_reward = excluded.xp_reward,
  sanity_delta = 0,
  icon_key = excluded.icon_key,
  is_major = excluded.is_major,
  active = true,
  updated_at = now();

-- Keep the Reading catalogue aligned with the agreed six tasks.
update public.tasks
set active = false, updated_at = now()
where category_id = (select id from public.task_categories where slug = 'reading')
  and slug not in ('skim-abstract', 'extract-citations', 'read-paper', 'paper-notes', 'read-book-chapter', 'identify-research-gap');

-- Keep the Writing catalogue aligned with the canonical task list.
update public.tasks
set active = false, updated_at = now()
where category_id = (select id from public.task_categories where slug = 'writing')
  and slug not in ('revise-paragraph', 'craft-figure-table', 'prepare-abstract', 'prepare-outline', 'write-section', 'finish-section', 'submit-conference-paper', 'submit-journal-paper');

-- Keep the Research catalogue aligned with the agreed nine tasks.
update public.tasks
set active = false, updated_at = now()
where category_id = (select id from public.task_categories where slug = 'research')
  and slug not in ('research-question', 'search-strategy', 'clean-dataset', 'create-questionnaire', 'design-protocol', 'complete-data-collection', 'statistical-analysis', 'interpret-results', 'confirm-hypothesis');

-- Keep the Coding catalogue aligned with the agreed seven tasks.
update public.tasks
set active = false, updated_at = now()
where category_id = (select id from public.task_categories where slug = 'coding')
  and slug not in ('add-feature', 'create-pipeline', 'finish-script', 'run-model', 'setup-environment', 'create-interface', 'develop-app');

-- Keep the Experiments catalogue aligned with the agreed seven tasks.
update public.tasks
set active = false, updated_at = now()
where category_id = (select id from public.task_categories where slug = 'experiments')
  and slug not in ('clean-lab', 'prepare-samples', 'calibrate-equipment', 'prepare-protocol', 'record-observations', 'analyze-experimental-data', 'perform-experiment');

-- Keep the Academic catalogue aligned with the agreed eight tasks.
update public.tasks
set active = false, updated_at = now()
where category_id = (select id from public.task_categories where slug = 'academic')
  and slug not in ('attend-class', 'seminar', 'network-researcher', 'attend-conference', 'review-paper', 'pass-exam', 'submit-proposal', 'present-in-conference');

-- Keep the Teaching catalogue aligned with the agreed seven tasks.
update public.tasks
set active = false, updated_at = now()
where category_id = (select id from public.task_categories where slug = 'teaching')
  and slug not in ('grade-paper', 'give-student-feedback', 'help-labmate', 'help-workshop', 'prepare-lecture', 'supervise-exam', 'teach-class-workshop');

-- Keep the Admin catalogue aligned with the agreed eight tasks.
update public.tasks
set active = false, updated_at = now()
where category_id = (select id from public.task_categories where slug = 'admin')
  and slug not in ('clean-desk', 'make-call', 'organise-files', 'plan-week', 'schedule-meeting', 'write-email', 'fill-form', 'survive-supervisor-meeting');

insert into public.titles(name,unlock_level) values
('Promising Research Organism',1),('Professional PDF Collector',3),('Compiler Whisperer',5),('Department Survivor',7),('Legend of the Lab',10)
on conflict do nothing;

insert into public.milestone_catalog
  (slug, title, description, icon_key, progress_weight, xp_reward, is_automatic, is_core_journey, active, sort_order)
values
('phd_started_voluntarily','PhD Started (Voluntarily)','You signed up for this. On purpose.','🌱',10,0,true,true,true,1),
('required_courses_completed','Required Courses Completed','The coursework is done. You may now return to your regularly scheduled research.','🎓',10,500,false,true,true,2),
('conference_presentation','Conference Presentation','You presented your research to a room full of academics and survived the questions.','🎤',10,600,false,true,true,3),
('journal_paper_1_published','Journal Paper #1 Published','Your first thesis-related first-author journal paper made it into the literature.','📖',10,1000,false,true,true,4),
('journal_paper_2_published','Journal Paper #2 Published','Two thesis-related first-author journal papers. Publication requirement complete.','📚',10,1250,false,true,true,5),
('preliminary_defence','Preliminary Defence','You survived the rehearsal boss fight.','🛡️',10,900,false,true,true,6),
('thesis_written','Thesis Written','The thesis exists. All of it.','📘',20,1500,false,true,true,7),
('defence_completed','Defence Completed','Final boss defeated.','🏆',20,2000,false,true,true,8)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  icon_key = excluded.icon_key,
  progress_weight = excluded.progress_weight,
  xp_reward = excluded.xp_reward,
  is_automatic = excluded.is_automatic,
  is_core_journey = excluded.is_core_journey,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.achievement_catalog(slug,name,description,icon_key,rarity,criteria_type,criteria) values
('it-begins','It Begins','Complete your first task.','🌱','common','task_count','{"count":1}'),
('inbox-warrior','Inbox Warrior','Defeat 10 emails.','📨','common','specific_task_count','{"task_slug":"reply-email","count":10}'),
('pdf-collector','Professional PDF Collector','Read 20 papers.','📚','rare','specific_task_count','{"task_slug":"read-paper","count":20}'),
('works-on-my-machine','Works On My Machine','Complete 10 coding tasks.','🖥️','rare','category_task_count','{"category_slug":"coding","count":10}'),
('science-technically-occurred','Science Technically Occurred','Log a failed experiment.','🧫','common','specific_task_count','{"task_slug":"failed-experiment","count":1}'),
('still-here','Still Here','Reach 500 XP.','🫡','epic','total_xp','{"count":500}')
on conflict do nothing;
