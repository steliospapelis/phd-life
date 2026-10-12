-- Shared daily quote system. The server chooses once per Athens calendar day.
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null check (btrim(text) <> ''),
  created_at timestamptz not null default now()
);

create unique index if not exists quotes_text_unique on public.quotes(text);

create table if not exists public.daily_quotes (
  date date primary key,
  quote_id uuid not null references public.quotes(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.quotes enable row level security;
alter table public.daily_quotes enable row level security;

drop policy if exists "quotes are readable" on public.quotes;
create policy "quotes are readable" on public.quotes for select to authenticated using (true);
drop policy if exists "daily quotes are readable" on public.daily_quotes;
create policy "daily quotes are readable" on public.daily_quotes for select to authenticated using (true);
revoke all on table public.quotes, public.daily_quotes from anon, authenticated;
grant select on table public.quotes, public.daily_quotes to authenticated;

-- The advisory lock serializes quote-cycle selection, while the date primary key
-- is the final safety layer for two callers opening on the same day.
create or replace function public.get_or_create_daily_quote()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
  v_yesterday_quote_id uuid;
  v_quote_id uuid;
  v_quote_text text;
  v_inserted_date date;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  perform pg_advisory_xact_lock(pg_catalog.hashtextextended('phd-life-daily-quote-cycle', 0));
  v_today := (now() at time zone 'Europe/Athens')::date;

  select d.quote_id, q.text into v_quote_id, v_quote_text
  from public.daily_quotes d
  join public.quotes q on q.id = d.quote_id
  where d.date = v_today;

  if found then
    return jsonb_build_object('date', v_today, 'quote', jsonb_build_object('id', v_quote_id::text, 'text', v_quote_text));
  end if;

  select d.quote_id into v_yesterday_quote_id
  from public.daily_quotes d
  where d.date = v_today - 1;

  -- Prefer quotes that have never appeared in daily_quotes. When the whole
  -- pool has been used, the next selection starts a fresh cycle.
  select q.id, q.text into v_quote_id, v_quote_text
  from public.quotes q
  where not exists (select 1 from public.daily_quotes d where d.quote_id = q.id)
  order by random()
  limit 1;

  if not found then
    select q.id, q.text into v_quote_id, v_quote_text
    from public.quotes q
    where v_yesterday_quote_id is null or q.id <> v_yesterday_quote_id
    order by random()
    limit 1;
  end if;

  if not found then
    select q.id, q.text into v_quote_id, v_quote_text
    from public.quotes q
    order by random()
    limit 1;
  end if;

  if v_quote_id is null then raise exception 'No quotes are available'; end if;

  insert into public.daily_quotes(date, quote_id)
  values (v_today, v_quote_id)
  on conflict (date) do nothing
  returning date into v_inserted_date;

  if v_inserted_date is null then
    select d.quote_id, q.text into v_quote_id, v_quote_text
    from public.daily_quotes d
    join public.quotes q on q.id = d.quote_id
    where d.date = v_today;
  end if;

  return jsonb_build_object('date', v_today, 'quote', jsonb_build_object('id', v_quote_id::text, 'text', v_quote_text));
end;
$$;

revoke all on function public.get_or_create_daily_quote() from public;
grant execute on function public.get_or_create_daily_quote() to authenticated;

-- Exactly 180 data-only records. Add future quotes here without changing the
-- service or Home screen; the unique text index makes reruns safe.
insert into public.quotes(text) values
('You opened the document. That''s basically momentum.'),
('One email answered. Civilization continues.'),
('You showed up. Annoyingly, that actually counts.'),
('Five productive minutes are still five minutes academia didn''t steal.'),
('Today''s progress may be microscopic. Luckily, you work in research.'),
('You don''t need a breakthrough today. A small crack will do.'),
('Reading one paragraph still counts as reading.'),
('If all you did today was make tomorrow easier, good job.'),
('Some days you move the thesis forward. Some days you stop it moving backward.'),
('You survived another calendar notification.'),
('Tiny progress is still legally progress.'),
('The bar was low today. You cleared it. Respect.'),
('Somewhere, an unanswered email is becoming emotionally attached to you.'),
('Your inbox contains several exciting opportunities to feel guilty.'),
('Replying "Thanks, noted" is an academic skill.'),
('Every PhD eventually becomes 30% research, 70% finding the correct form.'),
('You completed an administrative task. Please accept 400 imaginary XP.'),
('The attachment was, in fact, not attached.'),
('The meeting could have been an email. The email could have been ignored.'),
('Your institutional password expires in three days because peace was never an option.'),
('"Just following up" is academia''s most passive-aggressive spell.'),
('You found the correct PDF on the university website. Legendary drop.'),
('Inbox zero is a myth invented by productivity influencers.'),
('Congratulations, you have been CC''d into a situation.'),
('The hardest part of writing is apparently writing.'),
('Today''s goal: turn vague thoughts into academically defensible sentences.'),
('You have rewritten this sentence six times. It is now statistically significant.'),
('"Further research is needed." Convenient.'),
('Every paper begins as a terrible document named `final_v2_REAL`.'),
('Delete one unnecessary sentence. Reviewer 2 grows weaker.'),
('Your introduction currently has seventeen introductions.'),
('Writing is just arguing with yourself using citations.'),
('A paragraph appeared. Nobody ask how.'),
('The literature review expands to fill all available space.'),
('"We hypothesize…" sounds much better than "we had a feeling."'),
('Your thesis does not need to be beautiful today. It needs to exist.'),
('Reviewer 1: looks good. Reviewer 2: explain consciousness.'),
('Somewhere out there, Reviewer 2 has opened your manuscript.'),
('"Minor revisions" has entered the chat.'),
('Congratulations! Your paper has advanced to a new stage of waiting.'),
('Academic publishing: write for months, then refresh a webpage for months.'),
('The manuscript has been "under review" long enough to develop opinions.'),
('Citation count +1. Dopamine acquired.'),
('Your paper was rejected. Your research was not erased from existence.'),
('"Interesting work, however…" — famous last words.'),
('The journal wants your figures in a format last used by archaeologists.'),
('Acceptance email: the rarest legendary item.'),
('You responded politely to Reviewer 2. +10 Diplomacy.'),
('The experiment worked. Nobody touch anything.'),
('The experiment failed exactly as tradition demands.'),
('Today''s experiment has produced valuable data about what not to do.'),
('Research is mostly asking "why is it doing that?"'),
('If the result makes no sense, congratulations: you have a result.'),
('The equipment can sense fear.'),
('Everything was calibrated until you looked at it.'),
('Science progresses one mysteriously missing sample at a time.'),
('The protocol said "simple."'),
('A clean dataset is a mythical creature.'),
('You changed one variable. Seventeen things changed.'),
('The experiment finally worked at 18:47 on a Friday.'),
('The code works. Please do not ask why.'),
('You fixed the bug by changing something unrelated. Software engineering.'),
('`TODO: clean this later` has survived three research generations.'),
('Today''s model has discovered a bold new way to overfit.'),
('Your GPU is working harder than you are. Teamwork.'),
('The loss went down. Serotonin went up.'),
('Data preprocessing: where optimism goes to be normalized.'),
('If it runs, save the environment immediately.'),
('One missing comma has humbled greater minds than yours.'),
('The dataset has 14 columns. You understand maybe nine of them.'),
('Accuracy improved by 0.7%. Champagne remains premature.'),
('There is no fear like running code you haven''t touched in six months.'),
('"Quick meeting" detected. Estimated duration: unknowable.'),
('Your supervisor said "interesting." Interpret at your own risk.'),
('You prepared twelve slides. You will discuss slide two for forty minutes.'),
('Meeting notes: three new tasks generated from one completed task.'),
('The supervisor has suggested "a small addition."'),
('You entered the meeting with questions and left with side quests.'),
('"Let''s discuss this next week" — the academic checkpoint system.'),
('Good news: they liked it. Bad news: they had ideas.'),
('You survived the progress meeting. Autosave complete.'),
('Your supervisor replied "Looks fine." Print it. Frame it.'),
('That feedback was actually helpful. Rare event encountered.'),
('Today''s meeting contained only one new project idea. A miracle.'),
('Conference rule: everyone understands everyone else''s work except their own.'),
('You practiced for 20 minutes and finished in 11.'),
('The laser pointer has chosen violence.'),
('Your slide has eight plots and the emotional energy of a tax return.'),
('"Any questions?" The room has entered stealth mode.'),
('Networking: professionally asking strangers what they study.'),
('Free coffee detected. Conference value restored.'),
('Someone cited your work aloud. Core memory unlocked.'),
('You answered a question without saying "that''s a great question" first.'),
('Poster session objective: stand near rectangle and hope for friendship.'),
('Conference badge acquired. Social battery -40%.'),
('Your talk is over. You may now remember how breathing works.'),
('You explained it perfectly. Nobody understood. Academia.'),
('A student asked a question you have secretly wondered about for years.'),
('Teaching is discovering new ways to explain the same thing.'),
('Someone finally understood because of your explanation. Keep that one.'),
('Office hours: zero students for 55 minutes, four students at once afterward.'),
('The assignment instructions were clear. Apparently this was controversial.'),
('You learned the topic properly five minutes before teaching it.'),
('Teaching XP gained. Voice stamina lost.'),
('A student said "ohhh, now I get it." Critical hit.'),
('You graded everything. You may now see sunlight.'),
('Nobody fully knows what they''re doing. Some people just use LaTeX.'),
('A PhD is just repeatedly becoming the local expert on increasingly specific problems.'),
('You wanted knowledge. Knowledge came with paperwork.'),
('Your research question has developed subquestions.'),
('Every answer has unlocked three additional questions.'),
('Somewhere between curiosity and caffeine, a thesis is forming.'),
('You are technically becoming an expert. Terrifying.'),
('The PhD timeline is mostly arrows pointing in unexpected directions.'),
('Your niche is becoming so specific that Google knows you personally.'),
('One day you will explain this entire mess in 20 minutes at your defense.'),
('Future You is going to pretend this was all part of the plan.'),
('Academia: where "I don''t know" can become a four-year project.'),
('You are allowed to have an ordinary day while doing an extraordinary thing.'),
('Rest is not a failed productivity session.'),
('You do not have to earn the right to stop working tonight.'),
('Your worth is not stored in your publication count.'),
('Progress can be quiet.'),
('You are learning something difficult. Difficulty is not evidence that you are failing.'),
('A bad research day is still only one research day.'),
('You can care deeply about your PhD without letting it become your entire identity.'),
('There will be days when the smartest thing you do is go home.'),
('Your brain is part of the research equipment. Please maintain it.'),
('The thesis can wait until tomorrow. Your sleep cannot be backdated.'),
('You don''t need to impress academia today. Just be a person for a while.'),
('Today''s research assistant: one beverage and unreasonable optimism.'),
('Acquire snack. Continue science.'),
('Your desk plant believes in you and has absolutely no idea what your thesis is about.'),
('One cozy drink away from solving everything. Probably.'),
('Laptop open. Blanket acquired. Scholar mode activated.'),
('You deserve a little treat for knowing what "et al." means.'),
('The thesis goblin accepts offerings of coffee and completed paragraphs.'),
('Wear the comfy sweater. Peer review cannot stop you.'),
('Your research is complicated. Your snack choice doesn''t have to be.'),
('Tiny academic creature spotted completing tasks. Very impressive.'),
('Today''s schedule has been peer reviewed and rejected.'),
('You have three deadlines and somehow acquired a fourth.'),
('New side project unlocked without consent.'),
('You completed one task. Two more spawned.'),
('Your calendar and your ambitions are no longer on speaking terms.'),
('Research plan status: spiritually accurate.'),
('Current methodology: see what happens.'),
('Everything is under control in the broadest philosophical sense.'),
('You''ve entered the "this will only take ten minutes" boss fight.'),
('Today''s academic strategy: improvise confidently.'),
('Email sent. Quest complete.'),
('Citation added. Knowledge tree expanded.'),
('Meeting survived. Sanity mostly intact.'),
('Experiment completed. Outcome irrelevant. XP awarded.'),
('Paragraph written. Thesis HP +1.'),
('Bug fixed. Nobody needs to know how.'),
('Paper submitted. It belongs to the universe now.'),
('Feedback received. New questline unlocked.'),
('Deadline met. Temporal anomaly detected.'),
('You did the thing you were avoiding. Massive XP.'),
('Good day for suspicious levels of competence.'),
('You might actually know what you''re doing today.'),
('Momentum detected. Protect it at all costs.'),
('Your brain has decided to cooperate. Use this wisely.'),
('Look at you, generating knowledge before dinner.'),
('Productivity streak active. Please remain humble.'),
('Today feels dangerously manageable.'),
('The research is researching.'),
('You are currently winning against the document.'),
('Excellent work. Try not to accidentally start another project.'),
('Today''s objective: minimum viable PhD student.'),
('No heroic productivity required.'),
('Maybe today is a read-one-paper kind of day.'),
('Your brain has entered power-saving mode.'),
('You can lower the difficulty setting today.'),
('Nothing terrible happens if today''s progress is tiny.'),
('Science will still exist after lunch.'),
('You are not required to solve the thesis before 5 PM.'),
('Do the easiest useful thing first.'),
('Existing is currently worth XP.')
on conflict (text) do nothing;
