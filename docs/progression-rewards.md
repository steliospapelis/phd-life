# PhD Life progression rewards

The progression system reuses the existing `profiles`, `player_state`, `xp_ledger`, `task_logs`, `tasks`, `milestone_catalog`, and `user_milestones` tables.

Migration `0014_progression_rewards.sql` adds:

- `user_titles`, `task_tags`, `task_tag_map`, and `milestone_title_rewards`
- source-aware title metadata on `titles`
- data-driven rule metadata on `achievement_catalog`
- idempotency and reward-summary fields on `task_logs`
- 100 level titles, milestone titles, achievement-exclusive titles, and milestone badges
- semantic task-tag mappings
- authoritative RPCs for task completion, milestone rewards, title equipping, achievement evaluation, and progression snapshots

The client uses one normalized reward bundle for level-ups, achievements, and milestone rewards. Titles are unlocked server-side and are never equipped automatically. Profile is the canonical title-management location through the secondary Titles screen, while Journey → Achievements remains the badge collection.

## Supabase deployment

The migration is committed but must be applied to the Supabase project after it has been resumed. From the repository, with the Supabase CLI authenticated and the project linked:

```text
npx supabase db push
```

No existing XP, task logs, milestone completion, or equipped title is deleted by this migration. If the project has been paused for longer than the restore window, restore the project or create a replacement project before applying the migrations.

## Verification

The local application passes TypeScript, ESLint, and the Vitest suite. The test suite includes semantic tag counts, unrelated-tag rejection, distinct active days, compound achievement rules, and level-title unlock behavior.
