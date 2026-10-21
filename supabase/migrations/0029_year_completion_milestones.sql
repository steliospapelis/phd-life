-- Replace signup-time historical survival XP with explicit year-completion
-- milestones. The daily survival claim remains a separate, ongoing reward.

-- Retire the old onboarding-only RPCs so a client cannot accidentally grant
-- historical XP during account creation after this migration is applied.
drop function if exists public.complete_onboarding(text, smallint, jsonb, text);
drop function if exists public.initialize_phd_survival(smallint);

-- Keep the automatic start milestone, but rebalance the first three original
-- milestones to 5% each. The three year milestones below restore the overall
-- Journey total to exactly 100%.
update public.milestone_catalog
set progress_weight = case slug
  when 'phd_started_voluntarily' then 5
  when 'required_courses_completed' then 5
  when 'conference_presentation' then 5
  else progress_weight
end,
updated_at = now()
where slug in ('phd_started_voluntarily', 'required_courses_completed', 'conference_presentation');

insert into public.milestone_catalog
  (slug, title, description, icon_key, progress_weight, xp_reward, is_automatic, is_core_journey, active, sort_order, updated_at)
values
  ('complete_year_1', 'Complete Year 1', 'You made it through year one. The literature has not defeated you yet.', '🌱', 5, 1000, false, true, true, 2, now()),
  ('complete_year_2', 'Complete Year 2', 'Year two is complete. You now know enough to be concerned.', '🌿', 5, 1000, false, true, true, 3, now()),
  ('complete_year_3', 'Complete Year 3', 'Year three is done. You have opinions about methodology now.', '🌳', 5, 1000, false, true, true, 4, now())
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

-- Place the original milestones after the year checkpoints without changing
-- the identity of any existing completion records.
update public.milestone_catalog
set sort_order = case slug
  when 'phd_started_voluntarily' then 1
  when 'required_courses_completed' then 5
  when 'conference_presentation' then 6
  when 'journal_paper_1_published' then 7
  when 'journal_paper_2_published' then 8
  when 'preliminary_defence' then 9
  when 'thesis_written' then 10
  when 'defence_completed' then 11
  else sort_order
end,
updated_at = now()
where is_core_journey and active;

do $$
declare v_total integer;
begin
  select coalesce(sum(progress_weight), 0) into v_total
  from public.milestone_catalog
  where active and is_core_journey;
  if v_total <> 100 then
    raise exception 'Canonical PhD Journey progress must total 100, got %', v_total;
  end if;
end $$;

