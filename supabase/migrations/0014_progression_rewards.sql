-- PhD Life progression rewards
-- Extends the existing titles, achievements, milestones, and task completion
-- systems. It intentionally preserves XP, task logs, and milestone state.

-- ---------------------------------------------------------------------------
-- Catalog shape
-- ---------------------------------------------------------------------------

alter table public.titles add column if not exists slug text;
alter table public.titles add column if not exists source text not null default 'level';
alter table public.titles add column if not exists required_level smallint;
alter table public.titles add column if not exists milestone_id uuid;
alter table public.titles add column if not exists achievement_id uuid;
alter table public.titles add column if not exists sort_order integer not null default 0;
alter table public.titles add column if not exists created_at timestamptz not null default now();
alter table public.titles add column if not exists updated_at timestamptz not null default now();
alter table public.titles alter column unlock_level drop not null;

update public.titles
set slug = case lower(name)
  when 'promising research organism' then 'level-01-promising-research-organism'
  when 'professional pdf collector' then 'level-03-professional-pdf-collector'
  when 'compiler whisperer' then 'level-05-compiler-whisperer'
  when 'department survivor' then 'level-07-department-survivor'
  when 'legend of the lab' then 'level-10-legend-of-the-lab'
  else 'legacy-title-' || id::text
end
where slug is null;

update public.titles
set required_level = coalesce(required_level, unlock_level),
    source = 'level',
    sort_order = coalesce(sort_order, unlock_level);

alter table public.achievement_catalog add column if not exists category text not null default 'Meta';
alter table public.achievement_catalog add column if not exists rule_type text;
alter table public.achievement_catalog add column if not exists rule_config jsonb not null default '{}'::jsonb;
alter table public.achievement_catalog add column if not exists badge_key text;
alter table public.achievement_catalog add column if not exists title_reward_id uuid;
alter table public.achievement_catalog add column if not exists hidden boolean not null default false;

update public.achievement_catalog
set rule_type = case criteria_type
  when 'task_count' then 'total_tasks'
  when 'category_task_count' then 'tag_count'
  when 'specific_task_count' then 'tag_count'
  when 'total_xp' then 'level'
  when 'milestone_count' then 'milestone'
  else criteria_type
end,
rule_config = case criteria_type
  when 'task_count' then jsonb_build_object('type', 'total_tasks', 'count', coalesce((criteria->>'count')::integer, 1))
  when 'category_task_count' then jsonb_build_object('type', 'tag_count', 'tag', coalesce(criteria->>'category_slug', 'admin'), 'count', coalesce((criteria->>'count')::integer, 1))
  when 'specific_task_count' then jsonb_build_object('type', 'tag_count', 'tag', coalesce(criteria->>'task_slug', 'admin'), 'count', coalesce((criteria->>'count')::integer, 1))
  when 'total_xp' then jsonb_build_object('type', 'level', 'level', 5)
  when 'milestone_count' then jsonb_build_object('type', 'achievement_count', 'count', coalesce((criteria->>'count')::integer, 1))
  else coalesce(criteria, '{}'::jsonb)
end,
badge_key = coalesce(badge_key, slug)
where rule_type is null;

update public.achievement_catalog
set rule_type = coalesce(rule_type, criteria_type),
    rule_config = case when rule_config = '{}'::jsonb then criteria else rule_config end,
    badge_key = coalesce(badge_key, slug)
where rule_type is null or badge_key is null;

alter table public.milestone_catalog add column if not exists badge_key text;
update public.milestone_catalog set badge_key = coalesce(badge_key, 'milestone-' || slug) where badge_key is null;

create table if not exists public.user_titles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, title_id)
);

create table if not exists public.task_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.task_tag_map (
  task_id uuid not null references public.tasks(id) on delete cascade,
  tag_id uuid not null references public.task_tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

create table if not exists public.milestone_title_rewards (
  milestone_id uuid not null references public.milestone_catalog(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  primary key (milestone_id, title_id)
);

alter table public.task_logs add column if not exists xp_awarded integer;
alter table public.task_logs add column if not exists operation_key text;
alter table public.task_logs add column if not exists reward_summary jsonb;
create unique index if not exists task_logs_operation_key_unique on public.task_logs(user_id, operation_key) where operation_key is not null;

create unique index if not exists titles_slug_unique on public.titles(slug);
create index if not exists user_titles_user_idx on public.user_titles(user_id, unlocked_at desc);
create index if not exists task_tag_map_tag_idx on public.task_tag_map(tag_id, task_id);

-- Foreign keys are added after all participating tables exist.
do $$ begin
  alter table public.titles add constraint titles_milestone_fk foreign key (milestone_id) references public.milestone_catalog(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.titles add constraint titles_achievement_fk foreign key (achievement_id) references public.achievement_catalog(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.achievement_catalog add constraint achievement_title_reward_fk foreign key (title_reward_id) references public.titles(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.titles add constraint titles_source_fields_check check (
    (source = 'level' and required_level is not null and milestone_id is null and achievement_id is null)
    or (source = 'milestone' and required_level is null and milestone_id is not null and achievement_id is null)
    or (source = 'achievement' and required_level is null and milestone_id is null and achievement_id is not null)
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Stable title catalog: 100 level titles plus reward-only titles below.
-- ---------------------------------------------------------------------------

insert into public.level_thresholds(level, total_xp_required)
select level, 2900 + ((level - 10) * 1200) + (((level - 10) * (level - 11)) / 2) * 50
from generate_series(11, 100) as level
on conflict (level) do nothing;

with title_seed(level, slug, name) as (values
  (1,'level-01-promising-research-organism','Promising Research Organism'),
  (2,'level-02-abstract-skimmer','Abstract Skimmer'),
  (3,'level-03-professional-pdf-collector','Professional PDF Collector'),
  (4,'level-04-citation-summoner','Citation Summoner'),
  (5,'level-05-compiler-whisperer','Compiler Whisperer'),
  (6,'level-06-methodology-apprentice','Methodology Apprentice'),
  (7,'level-07-department-survivor','Department Survivor'),
  (8,'level-08-reviewer-two-negotiator','Reviewer #2 Negotiator'),
  (9,'level-09-thesis-fog-navigator','Thesis Fog Navigator'),
  (10,'level-10-legend-of-the-lab','Legend of the Lab'),
  (11,'level-11-literature-cartographer','Literature Cartographer'),
  (12,'level-12-spreadsheet-alchemist','Spreadsheet Alchemist'),
  (13,'level-13-data-cleaning-exorcist','Data Cleaning Exorcist'),
  (14,'level-14-hypothesis-wrangler','Hypothesis Wrangler'),
  (15,'level-15-footnote-archaeologist','Footnote Archaeologist'),
  (16,'level-16-deadline-cartographer','Deadline Cartographer'),
  (17,'level-17-statistical-sidekick','Statistical Sidekick'),
  (18,'level-18-lab-notebook-loyalist','Lab Notebook Loyalist'),
  (19,'level-19-theoretically-fine','Theoretically Fine'),
  (20,'level-20-conference-tote-bag-collector','Conference Tote Bag Collector'),
  (21,'level-21-protocol-whisperer','Protocol Whisperer'),
  (22,'level-22-sample-logistics-wizard','Sample Logistics Wizard'),
  (23,'level-23-calibration-mystic','Calibration Mystic'),
  (24,'level-24-results-interpreter','Results Interpreter'),
  (25,'level-25-coding-session-survivor','Coding Session Survivor'),
  (26,'level-26-figure-caption-diplomat','Figure Caption Diplomat'),
  (27,'level-27-reference-manager-royalty','Reference Manager Royalty'),
  (28,'level-28-peer-review-negotiator','Peer Review Negotiator'),
  (29,'level-29-methods-section-monarch','Methods Section Monarch'),
  (30,'level-30-analysis-pipeline-pilot','Analysis Pipeline Pilot'),
  (31,'level-31-data-point-shepherd','Data Point Shepherd'),
  (32,'level-32-significant-ish','Significant-ish'),
  (33,'level-33-citation-network-navigator','Citation Network Navigator'),
  (34,'level-34-reviewer-two-tamer','Reviewer 2 Tamer'),
  (35,'level-35-seminar-circuit-regular','Seminar Circuit Regular'),
  (36,'level-36-grant-application-goblin','Grant Application Goblin'),
  (37,'level-37-teaching-slide-sorcerer','Teaching Slide Sorcerer'),
  (38,'level-38-office-hours-oracle','Office Hours Oracle'),
  (39,'level-39-thesis-chapter-wrangler','Thesis Chapter Wrangler'),
  (40,'level-40-literature-review-lich','Literature Review Lich'),
  (41,'level-41-reproducibility-ranger','Reproducibility Ranger'),
  (42,'level-42-experimental-design-engineer','Experimental Design Engineer'),
  (43,'level-43-null-result-noble','Null Result Noble'),
  (44,'level-44-p-value-whisperer','P-value Whisperer'),
  (45,'level-45-deadline-escape-artist','Deadline Escape Artist'),
  (46,'level-46-collaboration-diplomat','Collaboration Diplomat'),
  (47,'level-47-abstract-archaeologist','Abstract Archaeologist'),
  (48,'level-48-introduction-improviser','Introduction Improviser'),
  (49,'level-49-revision-veteran','Revision Veteran'),
  (50,'level-50-manuscript-mechanic','Manuscript Mechanic'),
  (51,'level-51-figure-legend-laureate','Figure Legend Laureate'),
  (52,'level-52-dataset-whisperer','Dataset Whisperer'),
  (53,'level-53-statistical-storyteller','Statistical Storyteller'),
  (54,'level-54-lab-meeting-survivor','Lab Meeting Survivor'),
  (55,'level-55-email-triage-champion','Email Triage Champion'),
  (56,'level-56-calendar-tetris-master','Calendar Tetris Master'),
  (57,'level-57-spreadsheet-survivor','Spreadsheet Survivor'),
  (58,'level-58-code-review-diplomat','Code Review Diplomat'),
  (59,'level-59-pipeline-mechanic','Pipeline Mechanic'),
  (60,'level-60-model-training-wrangler','Model Training Wrangler'),
  (61,'level-61-interface-instigator','Interface Instigator'),
  (62,'level-62-debugging-diplomat','Debugging Diplomat'),
  (63,'level-63-automation-apprentice','Automation Apprentice'),
  (64,'level-64-experiment-scheduler','Experiment Scheduler'),
  (65,'level-65-sample-size-negotiator','Sample Size Negotiator'),
  (66,'level-66-conference-abstract-alchemist','Conference Abstract Alchemist'),
  (67,'level-67-poster-board-philosopher','Poster Board Philosopher'),
  (68,'level-68-presentation-deck-pilgrim','Presentation Deck Pilgrim'),
  (69,'level-69-q-and-a-escape-artist','Q&A Escape Artist'),
  (70,'level-70-teaching-assistant-ascendant','Teaching Assistant Ascendant'),
  (71,'level-71-feedback-provider','Feedback Provider'),
  (72,'level-72-mentorship-menace','Mentorship Menace'),
  (73,'level-73-paper-submission-alchemist','Paper Submission Alchemist'),
  (74,'level-74-journal-portal-veteran','Journal Portal Veteran'),
  (75,'level-75-revision-response-ranger','Revision Response Ranger'),
  (76,'level-76-acceptance-letter-conjurer','Acceptance Letter Conjurer'),
  (77,'level-77-publication-adjacent','Publication Adjacent'),
  (78,'level-78-first-author-energy','First Author Energy'),
  (79,'level-79-methods-section-alchemist','Methods Section Alchemist'),
  (80,'level-80-thesis-defense-warm-up','Thesis Defense Warm-Up'),
  (81,'level-81-committee-whisperer','Committee Whisperer'),
  (82,'level-82-viva-voce-voyager','Viva Voce Voyager'),
  (83,'level-83-defense-candidate','Defense Candidate'),
  (84,'level-84-final-chapter-boss','Final Chapter Boss'),
  (85,'level-85-dissertation-dragon-slayer','Dissertation Dragon Slayer'),
  (86,'level-86-archive-dweller','Archive Dweller'),
  (87,'level-87-institutional-memory','Institutional Memory'),
  (88,'level-88-lab-lore-keeper','Lab Lore Keeper'),
  (89,'level-89-academic-cryptid','Academic Cryptid'),
  (90,'level-90-citation-overlord','Citation Overlord'),
  (91,'level-91-reviewer-two-diplomat','Reviewer 2 Diplomat'),
  (92,'level-92-tenure-adjacent','Tenure-Adjacent'),
  (93,'level-93-conference-main-character','Conference Main Character'),
  (94,'level-94-bibliography-baron','Bibliography Baron'),
  (95,'level-95-the-work-continues','The Work Continues'),
  (96,'level-96-unreasonably-persistent','Unreasonably Persistent'),
  (97,'level-97-knowledge-economy-goblin','Knowledge Economy Goblin'),
  (98,'level-98-department-legend','Department Legend'),
  (99,'level-99-academic-final-form','Academic Final Form'),
  (100,'level-100-the-final-footnote','The Final Footnote')
)
insert into public.titles(slug, name, source, required_level, unlock_level, sort_order, active)
select slug, name, 'level', level, level, level, true from title_seed
on conflict (slug) do update set name = excluded.name, source = 'level', required_level = excluded.required_level, unlock_level = excluded.unlock_level, sort_order = excluded.sort_order, active = true, updated_at = now();

-- Reward-only titles are kept separate from level titles and are never auto-equipped.
with reward_seed(slug, name, source, milestone_slug) as (values
  ('milestone-courses-scholar','Coursework Survivor','milestone','courses'),
  ('milestone-conference-tote-bag-licensed','Tote Bag Licensed','milestone','conference'),
  ('milestone-presentation-projector-negotiator','Projector Negotiator','milestone','presentation'),
  ('milestone-paper-submission-manuscript-released','Manuscript Released','milestone','paper-submission'),
  ('milestone-publication-published-somehow','Published, Somehow','milestone','publication'),
  ('milestone-main-experiment-apparatus-whisperer','Apparatus Whisperer','milestone','main-experiment'),
  ('milestone-analysis-figure-behaver','Figure That Behaves','milestone','analysis'),
  ('milestone-thesis-draft-comment-magnet','Comment Magnet','milestone','thesis-draft'),
  ('milestone-defence-doctor-technically','Doctor, Technically','milestone','defence'),
  ('milestone-defence-doctor-actually','Doctor, Actually','milestone','defence')
)
insert into public.titles(slug, name, source, milestone_id, sort_order, active)
select r.slug, r.name, r.source, m.id, 1000 + row_number() over (order by r.slug), true
from reward_seed r join public.milestone_catalog m on m.slug = r.milestone_slug
on conflict (slug) do update set name = excluded.name, source = 'milestone', milestone_id = excluded.milestone_id, active = true, updated_at = now();

insert into public.milestone_title_rewards(milestone_id, title_id)
select m.id, t.id
from public.milestone_catalog m
join public.titles t on t.milestone_id = m.id and t.source = 'milestone'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Semantic task tags and centralized task-to-tag mapping.
-- ---------------------------------------------------------------------------

insert into public.task_tags(slug, label) values
  ('paper_reading','Paper reading'), ('literature_search','Literature search'), ('reference_management','Reference management'),
  ('writing','Writing'), ('revision','Revision'), ('figure_work','Figure work'), ('coding','Coding'), ('debugging','Debugging'),
  ('ml_training','Model training'), ('experiment','Experiment'), ('data_collection','Data collection'), ('data_analysis','Data analysis'),
  ('data_cleaning','Data cleaning'), ('spreadsheet','Spreadsheet'), ('email','Email'), ('meeting','Meeting'), ('admin','Admin'),
  ('teaching','Teaching'), ('mentoring','Mentoring'), ('conference','Conference'), ('poster','Poster'), ('presentation','Presentation'),
  ('paper_submission','Paper submission'), ('paper_revision','Paper revision'), ('peer_review_response','Peer review response'), ('publication','Publication')
on conflict (slug) do update set label = excluded.label, active = true;

with mappings(task_slug, tag_slug) as (values
  ('skim-abstract','paper_reading'), ('read-paper','paper_reading'), ('paper-notes','paper_reading'), ('read-book-chapter','paper_reading'), ('identify-research-gap','literature_search'), ('extract-citations','reference_management'),
  ('research-question','literature_search'), ('search-strategy','literature_search'), ('clean-dataset','data_cleaning'), ('create-questionnaire','data_collection'), ('interpret-results','data_analysis'), ('design-protocol','experiment'), ('complete-data-collection','data_collection'), ('statistical-analysis','data_analysis'), ('confirm-hypothesis','data_analysis'),
  ('revise-paragraph','revision'), ('craft-figure-table','figure_work'), ('prepare-abstract','writing'), ('prepare-outline','writing'), ('write-section','writing'), ('finish-section','writing'), ('submit-conference-paper','paper_submission'), ('submit-journal-paper','paper_submission'), ('submit-journal-paper','publication'),
  ('add-feature','coding'), ('create-pipeline','coding'), ('finish-script','coding'), ('run-model','coding'), ('run-model','ml_training'), ('setup-environment','coding'), ('create-interface','coding'), ('develop-app','coding'),
  ('clean-lab','experiment'), ('prepare-samples','experiment'), ('calibrate-equipment','experiment'), ('prepare-protocol','experiment'), ('record-observations','experiment'), ('analyze-experimental-data','data_analysis'), ('perform-experiment','experiment'),
  ('attend-class','teaching'), ('seminar','conference'), ('network-researcher','conference'), ('attend-conference','conference'), ('review-paper','peer_review_response'), ('pass-exam','teaching'), ('submit-proposal','paper_submission'), ('present-in-conference','presentation'), ('present-in-conference','conference'),
  ('grade-paper','teaching'), ('give-student-feedback','teaching'), ('help-labmate','mentoring'), ('help-workshop','teaching'), ('prepare-lecture','teaching'), ('supervise-exam','teaching'), ('teach-class-workshop','teaching'),
  ('clean-desk','admin'), ('make-call','admin'), ('organise-files','admin'), ('plan-week','admin'), ('schedule-meeting','meeting'), ('write-email','email'), ('fill-form','admin'), ('survive-supervisor-meeting','meeting')
)
insert into public.task_tag_map(task_id, tag_id)
select t.id, g.id from mappings m join public.tasks t on t.slug = m.task_slug join public.task_tags g on g.slug = m.tag_slug
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Achievement catalog and milestone badges.
-- ---------------------------------------------------------------------------

with achievement_seed(slug, name, description, category, rule_type, rule_config, badge_key, hidden, sort_order) as (values
  ('it-begins','It Begins','Complete your first valid task.','Meta','total_tasks','{"type":"total_tasks","count":1}'::jsonb,'it-begins',false,1),
  ('paper-trail','Paper Trail','Read 10 papers or book chapters.','Research','tag_count','{"type":"tag_count","tag":"paper_reading","count":10}'::jsonb,'paper-trail',false,2),
  ('pdf-collector','Professional PDF Collector','Read 20 papers or book chapters.','Research','tag_count','{"type":"tag_count","tag":"paper_reading","count":20}'::jsonb,'pdf-collector',false,3),
  ('citation-machine','Citation Machine','Extract 25 useful citations.','Research','tag_count','{"type":"tag_count","tag":"reference_management","count":25}'::jsonb,'citation-machine',false,4),
  ('literature-cartographer','Literature Cartographer','Plan 10 literature searches.','Research','tag_count','{"type":"tag_count","tag":"literature_search","count":10}'::jsonb,'literature-cartographer',false,5),
  ('works-on-my-machine','Works On My Machine','Complete 10 coding activities.','Coding','tag_count','{"type":"tag_count","tag":"coding","count":10}'::jsonb,'works-on-my-machine',false,10),
  ('debugging-diplomat','Debugging Diplomat','Complete 10 coding, model, or debugging activities.','Coding','tag_count','{"type":"tag_count","tag":"coding","count":10}'::jsonb,'debugging-diplomat',false,11),
  ('data-cleaner','Data Cleaner','Clean 10 datasets.','Experiment/Data','tag_count','{"type":"tag_count","tag":"data_cleaning","count":10}'::jsonb,'data-cleaner',false,20),
  ('science-technically-occurred','Science Technically Occurred','Complete 10 experiments.','Experiment/Data','tag_count','{"type":"tag_count","tag":"experiment","count":10}'::jsonb,'science-technically-occurred',false,21),
  ('results-have-entered-the-chat','Results Have Entered the Chat','Analyze 10 datasets or experimental outputs.','Experiment/Data','tag_count','{"type":"tag_count","tag":"data_analysis","count":10}'::jsonb,'results-have-entered-the-chat',false,22),
  ('inbox-warrior','Inbox Warrior','Write 10 academic emails.','Email/Admin','tag_count','{"type":"tag_count","tag":"email","count":10}'::jsonb,'inbox-warrior',false,30),
  ('calendar-tetris','Calendar Tetris','Survive 10 meetings.','Email/Admin','tag_count','{"type":"tag_count","tag":"meeting","count":10}'::jsonb,'calendar-tetris',false,31),
  ('admin-adjacent','Admin Adjacent','Complete 25 administrative tasks.','Email/Admin','tag_count','{"type":"tag_count","tag":"admin","count":25}'::jsonb,'admin-adjacent',false,32),
  ('helpful-by-accident','Helpful By Accident','Complete 10 mentoring activities.','Teaching','tag_count','{"type":"tag_count","tag":"mentoring","count":10}'::jsonb,'helpful-by-accident',false,40),
  ('teaching-assistant-energy','Teaching Assistant Energy','Complete 20 teaching activities.','Teaching','tag_count','{"type":"tag_count","tag":"teaching","count":20}'::jsonb,'teaching-assistant-energy',false,41),
  ('conference-creature','Conference Creature','Attend or present at 5 conferences.','Conferences','tag_count','{"type":"tag_count","tag":"conference","count":5}'::jsonb,'conference-creature',false,50),
  ('posterity','Posterity','Complete 5 presentation or poster activities.','Conferences','tag_count','{"type":"tag_count","tag":"presentation","count":5}'::jsonb,'posterity',false,51),
  ('submission-season','Submission Season','Submit 3 papers or proposals.','Publication','tag_count','{"type":"tag_count","tag":"paper_submission","count":3}'::jsonb,'submission-season',false,60),
  ('publication-adjacent','Publication Adjacent','Complete 5 publication-related tasks.','Publication','tag_count','{"type":"tag_count","tag":"publication","count":5}'::jsonb,'publication-adjacent',false,61),
  ('all-the-tabs','All the Tabs','Work across 5 task categories.','Meta','distinct_categories','{"type":"distinct_categories","count":5}'::jsonb,'all-the-tabs',false,70),
  ('active-researcher','Active Researcher','Log valid activities on 10 distinct calendar days.','Meta','active_days','{"type":"active_days","count":10}'::jsonb,'active-researcher',false,71),
  ('research-has-become-a-lifestyle','Research Has Become a Lifestyle','Complete 20 writing activities and 20 teaching activities.','Meta','all','{"type":"all","rules":[{"type":"tag_count","tag":"writing","count":20},{"type":"tag_count","tag":"teaching","count":20}]}'::jsonb,'research-has-become-a-lifestyle',false,72),
  ('still-here','Still Here','Reach level 5.','Meta','level','{"type":"level","level":5}'::jsonb,'still-here',false,73)
)
insert into public.achievement_catalog(slug, name, description, category, rule_type, rule_config, badge_key, hidden, criteria_type, criteria, icon_key, rarity, sort_order, active)
select slug, name, description, category, rule_type, rule_config, badge_key, hidden, rule_type, rule_config, badge_key, case when category = 'Meta' then 'common' else 'rare' end, sort_order, true
from achievement_seed
on conflict (slug) do update set name = excluded.name, description = excluded.description, category = excluded.category, rule_type = excluded.rule_type, rule_config = excluded.rule_config, badge_key = excluded.badge_key, hidden = excluded.hidden, criteria_type = excluded.criteria_type, criteria = excluded.criteria, active = true, sort_order = excluded.sort_order;

update public.titles t
set source = 'achievement', achievement_id = a.id, required_level = null, milestone_id = null
from public.achievement_catalog a
where t.slug = 'achievement-inbox-warrior' and a.slug = 'inbox-warrior';

-- Achievement-exclusive titles use stable slugs and are intentionally distinct
-- from the level catalog.
with achievement_titles(slug, name, achievement_slug, sort_order) as (values
  ('achievement-inbox-warrior-title','Inbox Tamer','inbox-warrior',200),
  ('achievement-pdf-collector-title','PDF Hoarder','pdf-collector',201),
  ('achievement-works-on-my-machine-title','Runtime Diplomat','works-on-my-machine',202),
  ('achievement-active-researcher-title','Calendar-Adjacent Scientist','active-researcher',203),
  ('achievement-submission-season-title','Portal Button Specialist','submission-season',204)
)
insert into public.titles(slug, name, source, achievement_id, sort_order, active)
select t.slug, t.name, 'achievement', a.id, t.sort_order, true
from achievement_titles t join public.achievement_catalog a on a.slug = t.achievement_slug
on conflict (slug) do update set name = excluded.name, source = 'achievement', achievement_id = excluded.achievement_id, active = true, updated_at = now();

update public.achievement_catalog a
set title_reward_id = t.id
from public.titles t
where t.achievement_id = a.id and a.title_reward_id is null;

-- ---------------------------------------------------------------------------
-- RLS and authoritative reward helpers.
-- ---------------------------------------------------------------------------

alter table public.user_titles enable row level security;
alter table public.task_tags enable row level security;
alter table public.task_tag_map enable row level security;
alter table public.milestone_title_rewards enable row level security;

drop policy if exists "titles readable" on public.titles;
create policy "titles readable" on public.titles for select to authenticated using (active = true);
drop policy if exists "own titles read" on public.user_titles;
create policy "own titles read" on public.user_titles for select to authenticated using (user_id = auth.uid());
drop policy if exists "task tags readable" on public.task_tags;
create policy "task tags readable" on public.task_tags for select to authenticated using (active = true);
drop policy if exists "task tag mappings readable" on public.task_tag_map;
create policy "task tag mappings readable" on public.task_tag_map for select to authenticated using (true);
drop policy if exists "milestone rewards readable" on public.milestone_title_rewards;
create policy "milestone rewards readable" on public.milestone_title_rewards for select to authenticated using (true);

create or replace function public.achievement_rule_progress(p_user_id uuid, p_rule jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_type text := coalesce(p_rule->>'type', 'total_tasks');
  v_target integer := greatest(coalesce((p_rule->>'count')::integer, (p_rule->>'level')::integer, 1), 1);
  v_current integer := 0;
  v_unlocked boolean := false;
  v_child jsonb;
  v_children integer := 0;
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
    select count(distinct (l.created_at at time zone coalesce((select timezone from public.profiles where id = p_user_id), 'UTC'))::date)::integer into v_current
    from public.task_logs l where l.user_id = p_user_id;
  elsif v_type = 'level' then
    select coalesce(max(level), 1)::integer into v_current from public.level_thresholds where total_xp_required <= coalesce((select total_xp from public.player_state where user_id = p_user_id), 0);
  elsif v_type = 'achievement_count' then
    select count(*)::integer into v_current from public.user_achievements where user_id = p_user_id;
  elsif v_type = 'milestone' then
    v_target := 1;
    select case when exists (
      select 1 from public.user_milestones um join public.milestone_catalog m on m.id = um.milestone_id
      where um.user_id = p_user_id and um.completed_at is not null and m.slug = p_rule->>'milestone_slug'
    ) then 1 else 0 end into v_current;
  elsif v_type = 'all' then
    v_target := jsonb_array_length(coalesce(p_rule->'rules', '[]'::jsonb));
    for v_child in select value from jsonb_array_elements(coalesce(p_rule->'rules', '[]'::jsonb)) loop
      if coalesce((public.achievement_rule_progress(p_user_id, v_child)->>'unlocked')::boolean, false) then v_children := v_children + 1; end if;
    end loop;
    v_current := v_children;
  end if;
  v_unlocked := v_current >= v_target;
  return jsonb_build_object('current', v_current, 'target', v_target, 'unlocked', v_unlocked);
end;
$$;
revoke all on function public.achievement_rule_progress(uuid, jsonb) from public;

create or replace function public.unlock_level_titles(p_user_id uuid, p_level integer)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_title record; v_inserted integer; v_result jsonb := '[]'::jsonb;
begin
  for v_title in select * from public.titles where source = 'level' and active = true and required_level <= p_level order by required_level, sort_order loop
    insert into public.user_titles(user_id, title_id) values (p_user_id, v_title.id) on conflict do nothing;
    get diagnostics v_inserted = row_count;
    if v_inserted = 1 then v_result := v_result || jsonb_build_array(jsonb_build_object('id', v_title.id, 'name', v_title.name, 'source', v_title.source, 'requiredLevel', v_title.required_level, 'slug', v_title.slug)); end if;
  end loop;
  return v_result;
end;
$$;
revoke all on function public.unlock_level_titles(uuid, integer) from public;

drop function if exists public.evaluate_achievements(uuid);
create or replace function public.evaluate_achievements(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_achievement record;
  v_progress jsonb;
  v_inserted integer;
  v_achievements jsonb := '[]'::jsonb;
  v_titles jsonb := '[]'::jsonb;
  v_title public.titles%rowtype;
begin
  for v_achievement in select * from public.achievement_catalog where active = true loop
    v_progress := public.achievement_rule_progress(p_user_id, coalesce(v_achievement.rule_config, v_achievement.criteria));
    if coalesce((v_progress->>'unlocked')::boolean, false) then
      insert into public.user_achievements(user_id, achievement_id) values (p_user_id, v_achievement.id) on conflict do nothing;
      get diagnostics v_inserted = row_count;
      if v_inserted = 1 then
        v_achievements := v_achievements || jsonb_build_array(jsonb_build_object('id', v_achievement.id, 'name', v_achievement.name, 'description', v_achievement.description, 'badgeKey', coalesce(v_achievement.badge_key, v_achievement.icon_key), 'category', v_achievement.category));
        if v_achievement.title_reward_id is not null then
          select * into v_title from public.titles where id = v_achievement.title_reward_id;
          insert into public.user_titles(user_id, title_id) values (p_user_id, v_title.id) on conflict do nothing;
          get diagnostics v_inserted = row_count;
          if v_inserted = 1 then v_titles := v_titles || jsonb_build_array(jsonb_build_object('id', v_title.id, 'name', v_title.name, 'source', v_title.source, 'achievementId', v_title.achievement_id, 'slug', v_title.slug)); end if;
        end if;
      end if;
    end if;
  end loop;
  return jsonb_build_object('achievements', v_achievements, 'titles', v_titles);
end;
$$;
revoke all on function public.evaluate_achievements(uuid) from public;
grant execute on function public.evaluate_achievements(uuid) to authenticated;

create or replace function public.validate_selected_title() returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if new.selected_title_id is not null and not exists (select 1 from public.user_titles where user_id = new.id and title_id = new.selected_title_id) then raise exception 'Title is still locked'; end if;
  return new;
end; $$;
drop trigger if exists validate_selected_title_update on public.profiles;
create trigger validate_selected_title_update before update of selected_title_id on public.profiles for each row execute procedure public.validate_selected_title();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, username) values (new.id, 'research_' || substr(replace(new.id::text,'-',''),1,7));
  insert into public.player_state(user_id) values (new.id);
  perform public.unlock_level_titles(new.id, 1);
  return new;
end; $$;

create or replace function public.select_title(p_title_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.user_titles where user_id = auth.uid() and title_id = p_title_id) then raise exception 'Title is still locked'; end if;
  update public.profiles set selected_title_id = p_title_id, updated_at = now() where id = auth.uid();
end; $$;
revoke all on function public.select_title(uuid) from public;
grant execute on function public.select_title(uuid) to authenticated;

drop function if exists public.complete_task(uuid);
drop function if exists public.complete_task(uuid, text);
create or replace function public.complete_task(p_task_id uuid, p_operation_key text default null)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_task public.tasks%rowtype;
  v_total integer;
  v_before integer;
  v_level integer;
  v_previous_level integer;
  v_sanity integer;
  v_reward jsonb;
  v_achievements jsonb;
  v_titles jsonb;
  v_existing jsonb;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_operation_key is not null then
    select reward_summary into v_existing from public.task_logs where user_id = auth.uid() and operation_key = p_operation_key;
    if v_existing is not null then return v_existing; end if;
  end if;
  select * into v_task from public.tasks where id = p_task_id and active = true;
  if not found then raise exception 'Task unavailable'; end if;
  select total_xp, sanity into v_total, v_sanity from public.player_state where user_id = auth.uid() for update;
  v_before := v_total;
  insert into public.task_logs(user_id, task_id, xp_awarded, operation_key) values (auth.uid(), p_task_id, v_task.xp_reward, p_operation_key);
  insert into public.xp_ledger(user_id, source_type, source_id, amount, source_key) values (auth.uid(), 'task', p_task_id, v_task.xp_reward, case when p_operation_key is null then null else 'task:' || p_operation_key end);
  v_total := v_total + v_task.xp_reward;
  v_sanity := greatest(0, least(100, v_sanity + v_task.sanity_delta));
  insert into public.sanity_ledger(user_id, source_type, source_id, delta, sanity_after) values (auth.uid(), 'task', p_task_id, v_task.sanity_delta, v_sanity);
  select coalesce(max(level), 1) into v_level from public.level_thresholds where total_xp_required <= v_total;
  select coalesce(max(level), 1) into v_previous_level from public.level_thresholds where total_xp_required <= v_before;
  update public.player_state set total_xp = v_total, sanity = v_sanity, updated_at = now() where user_id = auth.uid();
  v_titles := public.unlock_level_titles(auth.uid(), v_level);
  v_achievements := public.evaluate_achievements(auth.uid());
  v_titles := v_titles || coalesce(v_achievements->'titles', '[]'::jsonb);
  v_reward := jsonb_build_object(
    'xpGained', v_task.xp_reward,
    'xpAwarded', v_task.xp_reward,
    'totalXp', v_total,
    'sanity', v_sanity,
    'previousLevel', v_previous_level,
    'currentLevel', v_level,
    'level', v_level,
    'levelUp', v_level > v_previous_level,
    'unlockedTitles', v_titles,
    'unlockedAchievements', coalesce(v_achievements->'achievements', '[]'::jsonb)
  );
  update public.task_logs set reward_summary = v_reward where user_id = auth.uid() and p_operation_key is not null and operation_key = p_operation_key;
  return v_reward;
end;
$$;
revoke all on function public.complete_task(uuid, text) from public;
grant execute on function public.complete_task(uuid, text) to authenticated;

drop function if exists public.toggle_milestone(uuid);
create or replace function public.toggle_milestone(p_milestone_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_completed boolean;
  v_now_completed boolean;
  v_milestone public.milestone_catalog%rowtype;
  v_title record;
  v_inserted integer;
  v_titles jsonb := '[]'::jsonb;
  v_achievements jsonb;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into v_milestone from public.milestone_catalog where id = p_milestone_id and active = true;
  if not found then raise exception 'Milestone unavailable'; end if;
  select completed_at is not null into v_completed from public.user_milestones where user_id = auth.uid() and milestone_id = p_milestone_id;
  v_now_completed := not coalesce(v_completed, false);
  insert into public.user_milestones(user_id, milestone_id, completed_at) values (auth.uid(), p_milestone_id, case when v_now_completed then now() else null end)
    on conflict (user_id, milestone_id) do update set completed_at = case when public.user_milestones.completed_at is null then now() else null end;
  if v_now_completed then
    for v_title in select t.* from public.titles t join public.milestone_title_rewards r on r.title_id = t.id where r.milestone_id = p_milestone_id order by t.sort_order loop
      insert into public.user_titles(user_id, title_id) values (auth.uid(), v_title.id) on conflict do nothing;
      get diagnostics v_inserted = row_count;
      if v_inserted = 1 then v_titles := v_titles || jsonb_build_array(jsonb_build_object('id', v_title.id, 'name', v_title.name, 'source', v_title.source, 'milestoneId', v_title.milestone_id, 'slug', v_title.slug)); end if;
    end loop;
    v_achievements := public.evaluate_achievements(auth.uid());
  else
    v_achievements := jsonb_build_object('achievements','[]'::jsonb,'titles','[]'::jsonb);
  end if;
  return jsonb_build_object('completed', v_now_completed, 'milestone', jsonb_build_object('id', v_milestone.id, 'title', v_milestone.title), 'milestoneRewards', jsonb_build_object('titles', v_titles, 'achievement', case when jsonb_array_length(v_achievements->'achievements') > 0 then (v_achievements->'achievements')->0 else null end), 'unlockedTitles', v_titles || coalesce(v_achievements->'titles','[]'::jsonb), 'unlockedAchievements', coalesce(v_achievements->'achievements','[]'::jsonb));
end;
$$;
revoke all on function public.toggle_milestone(uuid) from public;
grant execute on function public.toggle_milestone(uuid) to authenticated;

create or replace function public.get_progression_snapshot()
returns jsonb language sql security definer set search_path = public
as $$
  select jsonb_build_object(
    'titles', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'slug', t.slug, 'name', t.name, 'source', t.source, 'requiredLevel', t.required_level, 'milestoneId', t.milestone_id, 'achievementId', t.achievement_id, 'unlocked', ut.user_id is not null, 'unlockedAt', ut.unlocked_at) order by case when p.selected_title_id = t.id then 0 when ut.user_id is not null then 1 else 2 end, t.sort_order, t.name) from public.titles t cross join public.profiles p left join public.user_titles ut on ut.title_id = t.id and ut.user_id = auth.uid() where p.id = auth.uid() and t.active), '[]'::jsonb),
    'achievements', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'slug', a.slug, 'name', a.name, 'description', a.description, 'category', a.category, 'ruleType', a.rule_type, 'ruleConfig', a.rule_config, 'badgeKey', coalesce(a.badge_key, a.icon_key), 'hidden', a.hidden, 'unlocked', ua.user_id is not null, 'unlockedAt', ua.unlocked_at, 'progressCurrent', (public.achievement_rule_progress(auth.uid(), a.rule_config)->>'current')::integer, 'progressTarget', (public.achievement_rule_progress(auth.uid(), a.rule_config)->>'target')::integer, 'titleRewardId', a.title_reward_id) order by a.sort_order, a.name) from public.achievement_catalog a left join public.user_achievements ua on ua.achievement_id = a.id and ua.user_id = auth.uid() where a.active and (not a.hidden or ua.user_id is not null)), '[]'::jsonb)
  );
$$;
revoke all on function public.get_progression_snapshot() from public;
grant execute on function public.get_progression_snapshot() to authenticated;

-- Backfill valid existing users without changing their current equipped title.
insert into public.user_titles(user_id, title_id)
select p.id, t.id from public.profiles p join public.player_state s on s.user_id = p.id join public.level_thresholds l on l.level = (select coalesce(max(level),1) from public.level_thresholds where total_xp_required <= s.total_xp) join public.titles t on t.source = 'level' and t.required_level <= l.level
on conflict do nothing;
select public.evaluate_achievements(id) from public.profiles;

