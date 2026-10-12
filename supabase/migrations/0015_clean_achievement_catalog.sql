-- Keep milestone progress in the milestone catalog only.
delete from public.user_achievements ua
using public.achievement_catalog a
where ua.achievement_id = a.id
  and a.rule_type = 'milestone';

delete from public.achievement_catalog
where rule_type = 'milestone';

-- Debugging Diplomat tracks ten coding/model/debugging activities directly.
-- A compound rule previously exposed its two internal checks as 0 / 2.
update public.achievement_catalog
set rule_type = 'tag_count',
    rule_config = '{"type":"tag_count","tag":"coding","count":10}'::jsonb,
    criteria_type = 'tag_count',
    criteria = '{"type":"tag_count","tag":"coding","count":10}'::jsonb
where slug = 'debugging-diplomat';
