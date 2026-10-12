# Content guide

Gameplay content lives in `supabase/seed.sql` and the matching Supabase tables. Change content there; do not add task names or XP rules to React components.

## Tasks

Add a category in `task_categories`, then add a task in `tasks` (or the seed insert). Set `category_id`, `slug`, `name`, `xp_reward`, `sanity_delta`, `icon_key`, and `is_major`. Keep `sanity_delta` conservative. The home screen automatically loads active categories/tasks.

## Titles

Add a row to `titles` with a unique `name` and `unlock_level`. The profile UI only enables titles where the player’s level meets that value. A future title-selection RPC should enforce the same rule server-side.

## Milestones

Add a `milestone_catalog` row. `progress_weight` controls the weighted journey percentage. Milestones are not prerequisites and may be completed in any order.

## Achievements

Add an `achievement_catalog` row with a supported `criteria_type` and JSONB `criteria`. Current examples are `task_count`, `specific_task_count`, `category_task_count`, `total_xp`, `level`, and `milestone_count`. Keep criteria small and explicit; do not turn this into a general-purpose rules language.

## Daily quotes

The shared daily quote pool lives in `supabase/migrations/0012_shared_daily_quotes.sql` and is seeded with exactly 180 data-only records. Add future quotes to that migration/seed source; do not add quote arrays, random selection, personalization, or quote logic to React components. The server-side `get_or_create_daily_quote()` RPC selects one quote per Europe/Athens calendar day and prevents repeats until the pool has been used.
