-- Expanded achievement catalog and authoritative achievement XP rewards.
-- Apply this migration in the Supabase SQL Editor after 0019_lab_citations.sql.

alter table public.achievement_catalog
  add column if not exists xp_reward integer not null default 20;

do $$ begin
  alter table public.achievement_catalog
    add constraint achievement_xp_reward_check check (xp_reward between 20 and 200);
exception when duplicate_object then null; end $$;

-- The requested catalog intentionally excludes "Labmate in the Making".
delete from public.user_achievements
where achievement_id in (select id from public.achievement_catalog where slug = 'labmate-in-the-making');
delete from public.achievement_catalog where slug = 'labmate-in-the-making';

with achievement_seed(slug, name, description, category, rule_type, rule_config, badge_key, icon_key, rarity, xp_reward, sort_order) as (values
('it-begins', 'It Begins', 'Complete your first valid task.', 'Meta', 'total_tasks', '{"type":"total_tasks","count":1}'::jsonb, 'it-begins', '🌱', 'common', '20', '1'),
  ('paper-trail', 'Paper Trail', 'Read 10 papers or book chapters.', 'Research', 'task_set_count', '{"type":"task_set_count","taskSlugs":["read-paper","read-book-chapter"],"count":10}'::jsonb, 'paper-trail', '📚', 'common', '30', '2'),
  ('pdf-collector', 'Professional PDF Collector', 'Read 20 papers or book chapters.', 'Research', 'task_set_count', '{"type":"task_set_count","taskSlugs":["read-paper","read-book-chapter"],"count":20}'::jsonb, 'pdf-collector', '📖', 'rare', '50', '3'),
  ('citation-machine', 'Citation Machine', 'Extract 25 useful citations.', 'Research', 'task_count', '{"type":"task_count","taskSlug":"extract-citations","count":25}'::jsonb, 'citation-machine', '🔖', 'rare', '50', '4'),
  ('literature-cartographer', 'Literature Cartographer', 'Plan 10 literature searches.', 'Research', 'task_count', '{"type":"task_count","taskSlug":"search-strategy","count":10}'::jsonb, 'literature-cartographer', '🗺️', 'rare', '40', '5'),
  ('works-on-my-machine', 'Works On My Machine', 'Complete 10 coding activities.', 'Coding', 'tag_count', '{"type":"tag_count","tag":"coding","count":10}'::jsonb, 'works-on-my-machine', '💻', 'rare', '40', '10'),
  ('debugging-diplomat', 'Debugging Diplomat', 'Complete 10 coding activities.', 'Coding', 'tag_count', '{"type":"tag_count","tag":"coding","count":10}'::jsonb, 'debugging-diplomat', '🐞', 'rare', '60', '11'),
  ('data-cleaner', 'Data Cleaner', 'Clean 10 datasets.', 'Experiment/Data', 'task_count', '{"type":"task_count","taskSlug":"clean-dataset","count":10}'::jsonb, 'data-cleaner', '🧹', 'rare', '40', '20'),
  ('science-technically-occurred', 'Science Technically Occurred', 'Perform 10 experiments.', 'Experiment/Data', 'task_count', '{"type":"task_count","taskSlug":"perform-experiment","count":10}'::jsonb, 'science-technically-occurred', '🧪', 'common', '50', '21'),
  ('results-have-entered-the-chat', 'Results Have Entered the Chat', 'Analyze 10 datasets or experimental outputs.', 'Experiment/Data', 'tag_count', '{"type":"tag_count","tag":"data_analysis","count":10}'::jsonb, 'results-have-entered-the-chat', '📊', 'rare', '50', '22'),
  ('inbox-warrior', 'Inbox Warrior', 'Write 10 academic emails.', 'Email/Admin', 'task_count', '{"type":"task_count","taskSlug":"write-email","count":10}'::jsonb, 'inbox-warrior', '📨', 'common', '30', '30'),
  ('calendar-tetris', 'Calendar Tetris', 'Complete 10 meeting-related tasks.', 'Email/Admin', 'task_set_count', '{"type":"task_set_count","taskSlugs":["schedule-meeting","survive-supervisor-meeting"],"count":10}'::jsonb, 'calendar-tetris', '🗓️', 'rare', '40', '31'),
  ('admin-adjacent', 'Admin Adjacent', 'Complete 25 administrative tasks.', 'Email/Admin', 'tag_count', '{"type":"tag_count","tag":"admin","count":25}'::jsonb, 'admin-adjacent', '🗂️', 'rare', '60', '32'),
  ('helpful-by-accident', 'Helpful By Accident', 'Help 10 labmates.', 'Teaching', 'task_count', '{"type":"task_count","taskSlug":"help-labmate","count":10}'::jsonb, 'helpful-by-accident', '🤝', 'rare', '40', '40'),
  ('teaching-assistant-energy', 'Teaching Assistant Energy', 'Complete 20 teaching activities.', 'Teaching', 'tag_count', '{"type":"tag_count","tag":"teaching","count":20}'::jsonb, 'teaching-assistant-energy', '🎓', 'rare', '60', '41'),
  ('conference-creature', 'Conference Creature', 'Attend or present at 5 conferences.', 'Conferences', 'task_set_count', '{"type":"task_set_count","taskSlugs":["attend-conference","present-in-conference"],"count":5}'::jsonb, 'conference-creature', '🎤', 'rare', '50', '50'),
  ('posterity', 'Posterity', 'Present at 5 conferences.', 'Conferences', 'task_count', '{"type":"task_count","taskSlug":"present-in-conference","count":5}'::jsonb, 'posterity', '🖼️', 'rare', '50', '51'),
  ('submission-season', 'Submission Season', 'Submit 3 papers or proposals.', 'Publication', 'tag_count', '{"type":"tag_count","tag":"paper_submission","count":3}'::jsonb, 'submission-season', '📤', 'rare', '80', '60'),
  ('publication-adjacent', 'Publication Adjacent', 'Submit 5 journal papers.', 'Publication', 'task_count', '{"type":"task_count","taskSlug":"submit-journal-paper","count":5}'::jsonb, 'publication-adjacent', '🏅', 'epic', '100', '61'),
  ('all-the-tabs', 'All the Tabs', 'Work across 5 task categories.', 'Meta', 'distinct_categories', '{"type":"distinct_categories","count":5}'::jsonb, 'all-the-tabs', '🗃️', 'rare', '60', '70'),
  ('active-researcher', 'Active Researcher', 'Log valid activities on 10 distinct calendar days.', 'Meta', 'active_days', '{"type":"active_days","count":10}'::jsonb, 'active-researcher', '🔬', 'rare', '40', '71'),
  ('research-has-become-a-lifestyle', 'Research Has Become a Lifestyle', 'Complete 20 writing activities and 20 teaching activities.', 'Meta', 'all', '{"type":"all","rules":[{"type":"tag_count","tag":"writing","count":20},{"type":"tag_count","tag":"teaching","count":20}]}'::jsonb, 'research-has-become-a-lifestyle', '🌙', 'epic', '120', '72'),
  ('still-here', 'Still Here', 'Reach level 5.', 'Meta', 'level', '{"type":"level","level":5}'::jsonb, 'still-here', '🫡', 'epic', '50', '73'),
  ('one-hundred-tiny-wins', 'One Hundred Tiny Wins', 'Complete 100 tasks.', 'Meta', 'total_tasks', '{"type":"total_tasks","count":100}'::jsonb, 'one-hundred-tiny-wins', '💯', 'epic', '80', '80'),
  ('two-hundred-plot-twists', 'Two Hundred Plot Twists', 'Complete 200 tasks.', 'Meta', 'total_tasks', '{"type":"total_tasks","count":200}'::jsonb, 'two-hundred-plot-twists', '🎢', 'epic', '120', '81'),
  ('xp-gremlin', 'XP Gremlin', 'Earn 1,000 XP.', 'Meta', 'total_xp', '{"type":"total_xp","count":1000}'::jsonb, 'xp-gremlin', '🪙', 'rare', '60', '82'),
  ('xp-hoarder', 'XP Hoarder', 'Earn 5,000 XP.', 'Meta', 'total_xp', '{"type":"total_xp","count":5000}'::jsonb, 'xp-hoarder', '💰', 'epic', '150', '83'),
  ('no-zero-days', 'No Zero Days', 'Log activity on 7 consecutive days.', 'Meta', 'streak_days', '{"type":"streak_days","count":7}'::jsonb, 'no-zero-days', '🔥', 'epic', '100', '84'),
  ('consistently-questionable', 'Consistently Questionable', 'Log activities on 30 distinct calendar days.', 'Meta', 'active_days', '{"type":"active_days","count":30}'::jsonb, 'consistently-questionable', '📅', 'epic', '120', '85'),
  ('weekly-regular', 'The Weekly Regular', 'Log activities on 7 distinct calendar days.', 'Meta', 'active_days', '{"type":"active_days","count":7}'::jsonb, 'weekly-regular', '🗓️', 'rare', '40', '86'),
  ('category-collector', 'Category Collector', 'Complete at least one task in all 8 task categories.', 'Meta', 'distinct_categories', '{"type":"distinct_categories","count":8}'::jsonb, 'category-collector', '🧩', 'epic', '80', '87'),
  ('abstract-survivor', 'Abstract Survivor', 'Skim 25 abstracts.', 'Reading', 'task_count', '{"type":"task_count","taskSlug":"skim-abstract","count":25}'::jsonb, 'abstract-survivor', '👀', 'common', '30', '100'),
  ('notes-were-actually-taken', 'Notes Were Actually Taken', 'Take notes on 10 papers.', 'Reading', 'task_count', '{"type":"task_count","taskSlug":"paper-notes","count":10}'::jsonb, 'notes-were-actually-taken', '🗒️', 'rare', '40', '101'),
  ('chapter-and-verse', 'Chapter and Verse', 'Read 5 book chapters.', 'Reading', 'task_count', '{"type":"task_count","taskSlug":"read-book-chapter","count":5}'::jsonb, 'chapter-and-verse', '📘', 'rare', '40', '102'),
  ('gap-spotter', 'Gap Spotter', 'Identify 5 research gaps.', 'Reading', 'task_count', '{"type":"task_count","taskSlug":"identify-research-gap","count":5}'::jsonb, 'gap-spotter', '💡', 'rare', '50', '103'),
  ('citation-archaeologist', 'Citation Archaeologist', 'Extract 50 useful citations.', 'Reading', 'task_count', '{"type":"task_count","taskSlug":"extract-citations","count":50}'::jsonb, 'citation-archaeologist', '🏺', 'epic', '80', '104'),
  ('literature-loop', 'Literature Loop', 'Read 50 papers or book chapters.', 'Reading', 'task_set_count', '{"type":"task_set_count","taskSlugs":["read-paper","read-book-chapter"],"count":50}'::jsonb, 'literature-loop', '🔁', 'epic', '120', '105'),
  ('paragraph-polisher', 'Paragraph Polisher', 'Revise 25 paragraphs.', 'Writing', 'task_count', '{"type":"task_count","taskSlug":"revise-paragraph","count":25}'::jsonb, 'paragraph-polisher', '🔧', 'rare', '50', '120'),
  ('section-by-section', 'Section by Section', 'Write 10 sections.', 'Writing', 'task_count', '{"type":"task_count","taskSlug":"write-section","count":10}'::jsonb, 'section-by-section', '✍️', 'rare', '60', '121'),
  ('outline-first-panic-later', 'Outline First, Panic Later', 'Prepare 10 outlines.', 'Writing', 'task_count', '{"type":"task_count","taskSlug":"prepare-outline","count":10}'::jsonb, 'outline-first-panic-later', '🗂️', 'rare', '40', '122'),
  ('figure-it-out', 'Figure It Out', 'Create 10 figures or tables.', 'Writing', 'task_count', '{"type":"task_count","taskSlug":"craft-figure-table","count":10}'::jsonb, 'figure-it-out', '📈', 'rare', '50', '123'),
  ('revision-season', 'Revision Season', 'Revise 50 paragraphs.', 'Writing', 'task_count', '{"type":"task_count","taskSlug":"revise-paragraph","count":50}'::jsonb, 'revision-season', '♻️', 'epic', '100', '124'),
  ('the-abstract-is-abstracting', 'The Abstract Is Abstracting', 'Write 10 abstracts.', 'Writing', 'task_count', '{"type":"task_count","taskSlug":"prepare-abstract","count":10}'::jsonb, 'the-abstract-is-abstracting', '🧾', 'rare', '60', '125'),
  ('journal-portal-regular', 'Journal Portal Regular', 'Submit 3 journal papers.', 'Writing', 'task_count', '{"type":"task_count","taskSlug":"submit-journal-paper","count":3}'::jsonb, 'journal-portal-regular', '🚀', 'epic', '120', '126'),
  ('questionable-questions', 'Questionable Questions', 'Define 10 research questions.', 'Research', 'task_count', '{"type":"task_count","taskSlug":"research-question","count":10}'::jsonb, 'questionable-questions', '❓', 'rare', '50', '140'),
  ('protocol-protocol', 'Protocol Protocol', 'Design 5 study protocols.', 'Research', 'task_count', '{"type":"task_count","taskSlug":"design-protocol","count":5}'::jsonb, 'protocol-protocol', '📑', 'rare', '60', '141'),
  ('dataset-janitor', 'Dataset Janitor', 'Clean 25 datasets.', 'Research', 'task_count', '{"type":"task_count","taskSlug":"clean-dataset","count":25}'::jsonb, 'dataset-janitor', '🧹', 'epic', '100', '142'),
  ('statistically-speaking', 'Statistically Speaking', 'Perform 10 statistical analyses.', 'Research', 'task_count', '{"type":"task_count","taskSlug":"statistical-analysis","count":10}'::jsonb, 'statistically-speaking', '📊', 'epic', '80', '143'),
  ('questionnaire-era', 'Questionnaire Era', 'Create 5 questionnaires.', 'Research', 'task_count', '{"type":"task_count","taskSlug":"create-questionnaire","count":5}'::jsonb, 'questionnaire-era', '📝', 'rare', '50', '144'),
  ('hypothesis-whisperer', 'Hypothesis Whisperer', 'Confirm 5 hypotheses.', 'Research', 'task_count', '{"type":"task_count","taskSlug":"confirm-hypothesis","count":5}'::jsonb, 'hypothesis-whisperer', '✅', 'epic', '100', '145'),
  ('interpretation-station', 'Interpretation Station', 'Interpret 15 sets of results.', 'Research', 'task_count', '{"type":"task_count","taskSlug":"interpret-results","count":15}'::jsonb, 'interpretation-station', '💡', 'epic', '80', '146'),
  ('script-kiddie-academically', 'Script Kiddie, Academically', 'Finish 10 scripts.', 'Coding', 'task_count', '{"type":"task_count","taskSlug":"finish-script","count":10}'::jsonb, 'script-kiddie-academically', '📜', 'rare', '50', '160'),
  ('pipeline-dreams', 'Pipeline Dreams', 'Create 5 pipelines.', 'Coding', 'task_count', '{"type":"task_count","taskSlug":"create-pipeline","count":5}'::jsonb, 'pipeline-dreams', '🔌', 'rare', '80', '161'),
  ('feature-creep-but-productive', 'Feature Creep, But Productive', 'Add 10 features.', 'Coding', 'task_count', '{"type":"task_count","taskSlug":"add-feature","count":10}'::jsonb, 'feature-creep-but-productive', '✨', 'rare', '50', '162'),
  ('interface-enjoyer', 'Interface Enjoyer', 'Create 5 interfaces.', 'Coding', 'task_count', '{"type":"task_count","taskSlug":"create-interface","count":5}'::jsonb, 'interface-enjoyer', '🖥️', 'rare', '60', '163'),
  ('works-on-most-machines', 'Works On Most Machines', 'Run 25 models.', 'Coding', 'task_count', '{"type":"task_count","taskSlug":"run-model","count":25}'::jsonb, 'works-on-most-machines', '🤖', 'epic', '80', '164'),
  ('full-stack-researcher', 'Full Stack Researcher', 'Develop 3 apps.', 'Coding', 'task_count', '{"type":"task_count","taskSlug":"develop-app","count":3}'::jsonb, 'full-stack-researcher', '📱', 'epic', '150', '165'),
  ('calibrated-and-concerned', 'Calibrated and Concerned', 'Calibrate equipment 10 times.', 'Experiments', 'task_count', '{"type":"task_count","taskSlug":"calibrate-equipment","count":10}'::jsonb, 'calibrated-and-concerned', '🎛️', 'rare', '50', '180'),
  ('sample-size-matters', 'Sample Size Matters', 'Prepare 25 samples.', 'Experiments', 'task_count', '{"type":"task_count","taskSlug":"prepare-samples","count":25}'::jsonb, 'sample-size-matters', '🧫', 'epic', '80', '181'),
  ('observation-nation', 'Observation Nation', 'Record 50 observations.', 'Experiments', 'task_count', '{"type":"task_count","taskSlug":"record-observations","count":50}'::jsonb, 'observation-nation', '🔎', 'epic', '80', '182'),
  ('lab-coat-energy', 'Lab Coat Energy', 'Perform 25 experiments.', 'Experiments', 'task_count', '{"type":"task_count","taskSlug":"perform-experiment","count":25}'::jsonb, 'lab-coat-energy', '🥼', 'epic', '120', '183'),
  ('the-data-is-in', 'The Data Is In', 'Analyze 25 experimental datasets.', 'Experiments', 'task_count', '{"type":"task_count","taskSlug":"analyze-experimental-data","count":25}'::jsonb, 'the-data-is-in', '🧪', 'epic', '100', '184'),
  ('seminar-regular', 'Seminar Regular', 'Attend 10 seminars.', 'Academic', 'task_count', '{"type":"task_count","taskSlug":"seminar","count":10}'::jsonb, 'seminar-regular', '🎤', 'rare', '40', '200'),
  ('conference-circuit', 'Conference Circuit', 'Attend 10 conferences.', 'Academic', 'task_count', '{"type":"task_count","taskSlug":"attend-conference","count":10}'::jsonb, 'conference-circuit', '🎟️', 'epic', '100', '201'),
  ('reviewer-two', 'Reviewer Two', 'Review 10 papers.', 'Academic', 'task_count', '{"type":"task_count","taskSlug":"review-paper","count":10}'::jsonb, 'reviewer-two', '🧐', 'epic', '80', '202'),
  ('professional-small-talk', 'Professional Small Talk', 'Network with 20 researchers.', 'Academic', 'task_count', '{"type":"task_count","taskSlug":"network-researcher","count":20}'::jsonb, 'professional-small-talk', '🤝', 'rare', '60', '203'),
  ('proposal-machine', 'Proposal Machine', 'Submit 5 proposals.', 'Academic', 'task_count', '{"type":"task_count","taskSlug":"submit-proposal","count":5}'::jsonb, 'proposal-machine', '📨', 'epic', '100', '204'),
  ('exam-season-survivor', 'Exam Season Survivor', 'Pass 3 exams.', 'Academic', 'task_count', '{"type":"task_count","taskSlug":"pass-exam","count":3}'::jsonb, 'exam-season-survivor', '📝', 'epic', '100', '205'),
  ('classically-academic', 'Classically Academic', 'Attend 20 classes.', 'Academic', 'task_count', '{"type":"task_count","taskSlug":"attend-class","count":20}'::jsonb, 'classically-academic', '📚', 'rare', '80', '206'),
  ('feedback-loop', 'Feedback Loop', 'Give feedback to 25 students.', 'Teaching', 'task_count', '{"type":"task_count","taskSlug":"give-student-feedback","count":25}'::jsonb, 'feedback-loop', '💬', 'epic', '80', '220'),
  ('gradebook-goblin', 'Gradebook Goblin', 'Grade 50 papers.', 'Teaching', 'task_count', '{"type":"task_count","taskSlug":"grade-paper","count":50}'::jsonb, 'gradebook-goblin', '📝', 'epic', '100', '221'),
  ('lecture-circuit', 'Lecture Circuit', 'Prepare 10 lectures.', 'Teaching', 'task_count', '{"type":"task_count","taskSlug":"prepare-lecture","count":10}'::jsonb, 'lecture-circuit', '📚', 'rare', '60', '222'),
  ('workshop-wizard', 'Workshop Wizard', 'Help with 10 workshops.', 'Teaching', 'task_count', '{"type":"task_count","taskSlug":"help-workshop","count":10}'::jsonb, 'workshop-wizard', '🧑‍🏫', 'rare', '60', '223'),
  ('teaching-in-public', 'Teaching in Public', 'Teach 10 classes or workshops.', 'Teaching', 'task_count', '{"type":"task_count","taskSlug":"teach-class-workshop","count":10}'::jsonb, 'teaching-in-public', '🏫', 'epic', '100', '224'),
  ('exam-room-veteran', 'Exam Room Veteran', 'Supervise 10 exams.', 'Teaching', 'task_count', '{"type":"task_count","taskSlug":"supervise-exam","count":10}'::jsonb, 'exam-room-veteran', '🧾', 'epic', '80', '225'),
  ('labmate-lifeline', 'Labmate Lifeline', 'Help 25 labmates.', 'Teaching', 'task_count', '{"type":"task_count","taskSlug":"help-labmate","count":25}'::jsonb, 'labmate-lifeline', '🫶', 'epic', '100', '226'),
  ('call-me-maybe', 'Call Me Maybe', 'Make 20 calls.', 'Admin', 'task_count', '{"type":"task_count","taskSlug":"make-call","count":20}'::jsonb, 'call-me-maybe', '📞', 'rare', '40', '240'),
  ('formidable', 'Formidable', 'Fill in 15 forms.', 'Admin', 'task_count', '{"type":"task_count","taskSlug":"fill-form","count":15}'::jsonb, 'formidable', '📋', 'rare', '60', '241'),
  ('filing-cabinet-energy', 'Filing Cabinet Energy', 'Organise files 25 times.', 'Admin', 'task_count', '{"type":"task_count","taskSlug":"organise-files","count":25}'::jsonb, 'filing-cabinet-energy', '🗃️', 'rare', '50', '242'),
  ('desk-reset', 'Desk Reset', 'Clean your desk 20 times.', 'Admin', 'task_count', '{"type":"task_count","taskSlug":"clean-desk","count":20}'::jsonb, 'desk-reset', '🧽', 'rare', '40', '243'),
  ('week-planner', 'Week Planner', 'Plan 20 weeks.', 'Admin', 'task_count', '{"type":"task_count","taskSlug":"plan-week","count":20}'::jsonb, 'week-planner', '🗺️', 'rare', '40', '244'),
  ('supervisor-survivor', 'Supervisor Survivor', 'Survive 10 supervisor meetings.', 'Admin', 'task_count', '{"type":"task_count","taskSlug":"survive-supervisor-meeting","count":10}'::jsonb, 'supervisor-survivor', '🫡', 'epic', '80', '245'),
  ('email-final-boss', 'Email Final Boss', 'Write 100 academic emails.', 'Admin', 'task_count', '{"type":"task_count","taskSlug":"write-email","count":100}'::jsonb, 'email-final-boss', '📧', 'epic', '100', '246'),
  ('citation-economy', 'Citation Economy', 'Cite 10 labmate activity posts.', 'Social', 'citation_given', '{"type":"citation_given","count":10}'::jsonb, 'citation-economy', '🪙', 'rare', '50', '260'),
  ('community-scholar', 'Community Scholar', 'Cite 50 labmate activity posts.', 'Social', 'citation_given', '{"type":"citation_given","count":50}'::jsonb, 'community-scholar', '🌐', 'epic', '120', '261'),
  ('research-is-better-together', 'Research Is Better Together', 'Have 3 active labmates.', 'Social', 'friend_count', '{"type":"friend_count","count":3}'::jsonb, 'research-is-better-together', '🧑‍🔬', 'rare', '60', '262'),
  ('small-wins-network', 'Small Wins Network', 'Receive citations from 3 different labmates.', 'Social', 'citation_received', '{"type":"citation_received","count":3}'::jsonb, 'small-wins-network', '🌟', 'epic', '100', '263')
)
insert into public.achievement_catalog(
  slug, name, description, category, rule_type, rule_config, badge_key, icon_key,
  rarity, xp_reward, hidden, sort_order, criteria_type, criteria, active
)
select slug, name, description, category, rule_type, rule_config, badge_key, icon_key,
       rarity, xp_reward::integer, false, sort_order::integer, rule_type, rule_config, true
from achievement_seed
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  rule_type = excluded.rule_type,
  rule_config = excluded.rule_config,
  badge_key = excluded.badge_key,
  icon_key = excluded.icon_key,
  rarity = excluded.rarity,
  xp_reward = excluded.xp_reward,
  hidden = excluded.hidden,
  sort_order = excluded.sort_order,
  criteria_type = excluded.criteria_type,
  criteria = excluded.criteria,
  active = true;

create or replace function public.achievement_rule_progress(p_user_id uuid, p_rule jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_type text := coalesce(p_rule->>'type', 'total_tasks');
  v_target integer := greatest(coalesce((p_rule->>'count')::integer, (p_rule->>'level')::integer, 1), 1);
  v_current integer := 0;
  v_unlocked boolean := false;
  v_child jsonb;
  v_child_progress jsonb;
  v_children integer := 0;
  v_min_current integer;
  v_max_target integer := 1;
  v_date date;
  v_previous_date date;
  v_run integer := 0;
  v_longest integer := 0;
begin
  if v_type = 'tag_count' then
    select count(*)::integer into v_current
    from public.task_logs l
    join public.task_tag_map tm on tm.task_id = l.task_id
    join public.task_tags tg on tg.id = tm.tag_id
    where l.user_id = p_user_id and tg.slug = p_rule->>'tag';
  elsif v_type = 'total_tasks' then
    select count(*)::integer into v_current from public.task_logs where user_id = p_user_id;
  elsif v_type = 'task_count' then
    select count(*)::integer into v_current
    from public.task_logs l join public.tasks t on t.id = l.task_id
    where l.user_id = p_user_id and t.slug = p_rule->>'taskSlug';
  elsif v_type = 'task_set_count' then
    select count(*)::integer into v_current
    from public.task_logs l join public.tasks t on t.id = l.task_id
    where l.user_id = p_user_id and t.slug in (
      select jsonb_array_elements_text(coalesce(p_rule->'taskSlugs', '[]'::jsonb))
    );
  elsif v_type = 'total_xp' then
    select coalesce(total_xp, 0)::integer into v_current from public.player_state where user_id = p_user_id;
  elsif v_type = 'distinct_categories' then
    select count(distinct t.category_id)::integer into v_current
    from public.task_logs l join public.tasks t on t.id = l.task_id
    where l.user_id = p_user_id;
  elsif v_type = 'active_days' then
    select count(distinct (l.created_at at time zone coalesce((select timezone from public.profiles where id = p_user_id), 'UTC'))::date)::integer into v_current
    from public.task_logs l where l.user_id = p_user_id;
  elsif v_type = 'streak_days' then
    for v_date in
      select distinct (l.created_at at time zone coalesce((select timezone from public.profiles where id = p_user_id), 'UTC'))::date
      from public.task_logs l where l.user_id = p_user_id order by 1
    loop
      if v_previous_date is not null and v_date = v_previous_date + 1 then
        v_run := v_run + 1;
      else
        v_run := 1;
      end if;
      v_longest := greatest(v_longest, v_run);
      v_previous_date := v_date;
    end loop;
    v_current := v_longest;
  elsif v_type = 'level' then
    select coalesce(max(level), 1)::integer into v_current
    from public.level_thresholds
    where total_xp_required <= coalesce((select total_xp from public.player_state where user_id = p_user_id), 0);
  elsif v_type = 'achievement_count' then
    select count(*)::integer into v_current from public.user_achievements where user_id = p_user_id;
  elsif v_type = 'milestone' then
    v_target := 1;
    select case when exists (
      select 1 from public.user_milestones um
      join public.milestone_catalog m on m.id = um.milestone_id
      where um.user_id = p_user_id and um.completed_at is not null
        and m.slug = p_rule->>'milestone_slug'
    ) then 1 else 0 end into v_current;
  elsif v_type = 'friend_count' then
    select count(*)::integer into v_current
    from public.friendships f
    where f.status = 'accepted'
      and (f.requester_id = p_user_id or f.addressee_id = p_user_id);
  elsif v_type = 'citation_given' then
    if to_regclass('public.lab_kudos') is not null then
      execute 'select count(*)::integer from public.lab_kudos where user_id = $1' into v_current using p_user_id;
    else
      v_current := 0;
    end if;
  elsif v_type = 'citation_received' then
    if to_regclass('public.lab_kudos') is not null and to_regclass('public.shared_activity') is not null then
      execute 'select count(distinct lk.user_id)::integer from public.lab_kudos lk join public.shared_activity sa on sa.id = lk.activity_id where sa.user_id = $1' into v_current using p_user_id;
    else
      v_current := 0;
    end if;
  elsif v_type = 'all' then
    v_min_current := null;
    for v_child in select value from jsonb_array_elements(coalesce(p_rule->'rules', '[]'::jsonb)) loop
      v_child_progress := public.achievement_rule_progress(p_user_id, v_child);
      v_max_target := greatest(v_max_target, coalesce((v_child_progress->>'target')::integer, 1));
      v_min_current := least(coalesce(v_min_current, (v_child_progress->>'current')::integer), coalesce((v_child_progress->>'current')::integer, 0));
      if coalesce((v_child_progress->>'unlocked')::boolean, false) then v_children := v_children + 1; end if;
    end loop;
    v_target := v_max_target;
    v_current := least(coalesce(v_min_current, 0), v_target);
    v_unlocked := v_children = jsonb_array_length(coalesce(p_rule->'rules', '[]'::jsonb));
    return jsonb_build_object('current', v_current, 'target', v_target, 'unlocked', v_unlocked);
  end if;
  v_unlocked := v_current >= v_target;
  return jsonb_build_object('current', v_current, 'target', v_target, 'unlocked', v_unlocked);
end;
$$;

revoke all on function public.achievement_rule_progress(uuid, jsonb) from public;

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
  v_xp_awarded integer := 0;
begin
  for v_achievement in select * from public.achievement_catalog where active = true loop
    v_progress := public.achievement_rule_progress(p_user_id, coalesce(v_achievement.rule_config, v_achievement.criteria));
    if coalesce((v_progress->>'unlocked')::boolean, false) then
      insert into public.user_achievements(user_id, achievement_id)
      values (p_user_id, v_achievement.id)
      on conflict do nothing;
      get diagnostics v_inserted = row_count;
      if v_inserted = 1 then
        v_xp_awarded := v_xp_awarded + v_achievement.xp_reward;
        insert into public.xp_ledger(user_id, source_type, source_id, amount, source_key)
        values (p_user_id, 'achievement', v_achievement.id, v_achievement.xp_reward, 'achievement:' || v_achievement.id::text)
        on conflict do nothing;
        v_achievements := v_achievements || jsonb_build_array(jsonb_build_object(
          'id', v_achievement.id,
          'name', v_achievement.name,
          'description', v_achievement.description,
          'badgeKey', coalesce(v_achievement.badge_key, v_achievement.icon_key),
          'iconKey', v_achievement.icon_key,
          'category', v_achievement.category,
          'xpReward', v_achievement.xp_reward
        ));
        if v_achievement.title_reward_id is not null then
          select * into v_title from public.titles where id = v_achievement.title_reward_id;
          insert into public.user_titles(user_id, title_id) values (p_user_id, v_title.id) on conflict do nothing;
          get diagnostics v_inserted = row_count;
          if v_inserted = 1 then
            v_titles := v_titles || jsonb_build_array(jsonb_build_object(
              'id', v_title.id, 'name', v_title.name, 'source', v_title.source,
              'achievementId', v_title.achievement_id, 'slug', v_title.slug
            ));
          end if;
        end if;
      end if;
    end if;
  end loop;
  if v_xp_awarded > 0 then
    update public.player_state
    set total_xp = total_xp + v_xp_awarded, updated_at = now()
    where user_id = p_user_id;
  end if;
  return jsonb_build_object('achievements', v_achievements, 'titles', v_titles, 'xpAwarded', v_xp_awarded);
end;
$$;

revoke all on function public.evaluate_achievements(uuid) from public;
grant execute on function public.evaluate_achievements(uuid) to authenticated;

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
  v_achievement_result jsonb;
  v_titles jsonb;
  v_existing jsonb;
  v_achievement_xp integer := 0;
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
  insert into public.task_logs(user_id, task_id, xp_awarded, operation_key)
  values (auth.uid(), p_task_id, v_task.xp_reward, p_operation_key);
  insert into public.xp_ledger(user_id, source_type, source_id, amount, source_key)
  values (auth.uid(), 'task', p_task_id, v_task.xp_reward, case when p_operation_key is null then null else 'task:' || p_operation_key end);
  v_total := v_total + v_task.xp_reward;
  v_sanity := greatest(0, least(100, v_sanity + v_task.sanity_delta));
  insert into public.sanity_ledger(user_id, source_type, source_id, delta, sanity_after)
  values (auth.uid(), 'task', p_task_id, v_task.sanity_delta, v_sanity);
  update public.player_state set total_xp = v_total, sanity = v_sanity, updated_at = now() where user_id = auth.uid();
  select coalesce(max(level), 1) into v_level from public.level_thresholds where total_xp_required <= v_total;
  select coalesce(max(level), 1) into v_previous_level from public.level_thresholds where total_xp_required <= v_before;
  v_titles := public.unlock_level_titles(auth.uid(), v_level);
  v_achievement_result := public.evaluate_achievements(auth.uid());
  v_achievement_xp := coalesce((v_achievement_result->>'xpAwarded')::integer, 0);
  v_titles := coalesce(v_titles, '[]'::jsonb) || coalesce(v_achievement_result->'titles', '[]'::jsonb);
  select total_xp into v_total from public.player_state where user_id = auth.uid();
  select coalesce(max(level), 1) into v_level from public.level_thresholds where total_xp_required <= v_total;
  v_titles := v_titles || public.unlock_level_titles(auth.uid(), v_level);
  v_achievement_result := jsonb_set(v_achievement_result, '{titles}', v_titles);
  v_achievement_result := jsonb_set(v_achievement_result, '{achievements}', coalesce(v_achievement_result->'achievements', '[]'::jsonb));
  v_achievement_result := jsonb_set(v_achievement_result, '{xpAwarded}', to_jsonb(v_achievement_xp));
  v_existing := jsonb_build_object(
    'xpGained', v_task.xp_reward + v_achievement_xp,
    'xpAwarded', v_task.xp_reward,
    'achievementXpAwarded', v_achievement_xp,
    'totalXp', v_total,
    'sanity', v_sanity,
    'previousLevel', v_previous_level,
    'currentLevel', v_level,
    'level', v_level,
    'levelUp', v_level > v_previous_level,
    'unlockedTitles', v_titles,
    'unlockedAchievements', coalesce(v_achievement_result->'achievements', '[]'::jsonb)
  );
  update public.task_logs set reward_summary = v_existing
  where user_id = auth.uid() and p_operation_key is not null and operation_key = p_operation_key;
  return v_existing;
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
  insert into public.user_milestones(user_id, milestone_id, completed_at)
  values (auth.uid(), p_milestone_id, case when v_now_completed then now() else null end)
  on conflict (user_id, milestone_id) do update set completed_at = case when public.user_milestones.completed_at is null then now() else null end;
  if v_now_completed then
    for v_title in select t.* from public.titles t join public.milestone_title_rewards r on r.title_id = t.id where r.milestone_id = p_milestone_id order by t.sort_order loop
      insert into public.user_titles(user_id, title_id) values (auth.uid(), v_title.id) on conflict do nothing;
      get diagnostics v_inserted = row_count;
      if v_inserted = 1 then v_titles := v_titles || jsonb_build_array(jsonb_build_object('id', v_title.id, 'name', v_title.name, 'source', v_title.source, 'milestoneId', v_title.milestone_id, 'slug', v_title.slug)); end if;
    end loop;
    v_achievements := public.evaluate_achievements(auth.uid());
  else
    v_achievements := jsonb_build_object('achievements','[]'::jsonb,'titles','[]'::jsonb,'xpAwarded',0);
  end if;
  return jsonb_build_object(
    'completed', v_now_completed,
    'milestone', jsonb_build_object('id', v_milestone.id, 'title', v_milestone.title),
    'milestoneRewards', jsonb_build_object('titles', v_titles, 'achievement', case when jsonb_array_length(v_achievements->'achievements') > 0 then (v_achievements->'achievements')->0 else null end),
    'achievementXpAwarded', coalesce((v_achievements->>'xpAwarded')::integer, 0),
    'unlockedTitles', v_titles || coalesce(v_achievements->'titles','[]'::jsonb),
    'unlockedAchievements', coalesce(v_achievements->'achievements','[]'::jsonb)
  );
end;
$$;

revoke all on function public.toggle_milestone(uuid) from public;
grant execute on function public.toggle_milestone(uuid) to authenticated;

drop function if exists public.get_progression_snapshot();
create or replace function public.get_progression_snapshot()
returns jsonb language sql security definer set search_path = public
as $$
  select jsonb_build_object(
    'titles', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'slug', t.slug, 'name', t.name, 'source', t.source, 'requiredLevel', t.required_level, 'milestoneId', t.milestone_id, 'achievementId', t.achievement_id, 'unlocked', ut.user_id is not null, 'unlockedAt', ut.unlocked_at) order by case when p.selected_title_id = t.id then 0 when ut.user_id is not null then 1 else 2 end, t.sort_order, t.name) from public.titles t cross join public.profiles p left join public.user_titles ut on ut.title_id = t.id and ut.user_id = auth.uid() where p.id = auth.uid() and t.active), '[]'::jsonb),
    'achievements', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'slug', a.slug, 'name', a.name, 'description', a.description, 'category', a.category, 'ruleType', a.rule_type, 'ruleConfig', a.rule_config, 'badgeKey', coalesce(a.badge_key, a.icon_key), 'iconKey', a.icon_key, 'rarity', a.rarity, 'xpReward', a.xp_reward, 'hidden', a.hidden, 'unlocked', ua.user_id is not null, 'unlockedAt', ua.unlocked_at, 'progressCurrent', (public.achievement_rule_progress(auth.uid(), a.rule_config)->>'current')::integer, 'progressTarget', (public.achievement_rule_progress(auth.uid(), a.rule_config)->>'target')::integer, 'titleRewardId', a.title_reward_id) order by a.sort_order, a.name) from public.achievement_catalog a left join public.user_achievements ua on ua.achievement_id = a.id and ua.user_id = auth.uid() where a.active and (not a.hidden or ua.user_id is not null)), '[]'::jsonb)
  );
$$;

revoke all on function public.get_progression_snapshot() from public;
grant execute on function public.get_progression_snapshot() to authenticated;

-- Backfill existing users. Each newly unlocked achievement is awarded once and
-- gets a matching ledger entry because evaluate_achievements is idempotent.
select public.evaluate_achievements(id) from public.profiles;

-- Social actions can also complete achievements, so evaluate them at the moment
-- the underlying data changes rather than waiting for the next task.
create or replace function public.respond_to_friend_request(p_friendship_id uuid, p_accept boolean)
returns boolean language plpgsql security definer set search_path = public
as $$
declare
  v_updated boolean;
begin
  update public.friendships
  set status = case when p_accept then 'accepted' else 'declined' end,
      responded_at = now(),
      accepted_at = case when p_accept then now() else null end
  where id = p_friendship_id and addressee_id = auth.uid() and status = 'pending';
  v_updated := found;
  if v_updated and p_accept then perform public.evaluate_achievements(auth.uid()); end if;
  return v_updated;
end;
$$;

create or replace function public.toggle_lab_citation(p_activity_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_owner uuid;
  v_active boolean;
  v_count integer;
  v_achievement_result jsonb;
  v_total integer;
  v_level integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select sa.user_id into v_owner from public.shared_activity sa
  where sa.id = p_activity_id
    and sa.user_id <> auth.uid()
    and exists (select 1 from public.friendships f where f.status = 'accepted' and ((f.requester_id = auth.uid() and f.addressee_id = sa.user_id) or (f.addressee_id = auth.uid() and f.requester_id = sa.user_id)))
    and ((sa.source_type = 'milestone' and exists (select 1 from public.user_milestones um where um.user_id = sa.user_id and um.milestone_id = sa.source_id and um.completed_at is not null)) or (sa.source_type = 'achievement' and exists (select 1 from public.user_achievements ua where ua.user_id = sa.user_id and ua.achievement_id = sa.source_id)));
  if v_owner is null then raise exception 'Activity unavailable'; end if;
  if exists (select 1 from public.lab_kudos where activity_id = p_activity_id and user_id = auth.uid()) then
    delete from public.lab_kudos where activity_id = p_activity_id and user_id = auth.uid(); v_active := false;
  else
    insert into public.lab_kudos(activity_id, user_id) values (p_activity_id, auth.uid()); v_active := true;
  end if;
  select count(*)::integer into v_count from public.lab_kudos where activity_id = p_activity_id;
  v_achievement_result := public.evaluate_achievements(auth.uid());
  select total_xp into v_total from public.player_state where user_id = auth.uid();
  select coalesce(max(level), 1) into v_level from public.level_thresholds where total_xp_required <= v_total;
  return jsonb_build_object('active', v_active, 'count', v_count, 'achievementXpAwarded', coalesce((v_achievement_result->>'xpAwarded')::integer, 0), 'unlockedAchievements', coalesce(v_achievement_result->'achievements', '[]'::jsonb), 'totalXp', v_total, 'level', v_level);
end;
$$;

revoke all on function public.respond_to_friend_request(uuid, boolean) from public;
grant execute on function public.respond_to_friend_request(uuid, boolean) to authenticated;
revoke all on function public.toggle_lab_citation(uuid) from public;
grant execute on function public.toggle_lab_citation(uuid) to authenticated;

