# Social architecture

Social is a private labmate layer, not a public feed or leaderboard.

## Client routes

- `/social` shows Your people, pending requests, and the latest meaningful events.
- `/friends` shows accepted friends alphabetically.
- `/friend-requests` accepts or declines incoming requests.
- `/add-friend` searches by username only, with a 300ms debounce.
- `/friend-profile` shows a lightweight avatar, selected title, PhD year, selected achievements, milestones, friendship date, and a confirmed remove action.

## Event rules

`src/domain/social.ts` is the single place for event copy and relative timestamps. Normal task logging stays private. Meaningful events are limited to level-ups, achievements, milestones, conference moments, major research events, paper submissions/acceptances, thesis submission, and defense completion.

The `0013_social_redesign.sql` migration adds event metadata and source identity, a unique source index for idempotency, and an authoritative task-log trigger for major tasks. Events are only published when the profile's `share_activity` setting is enabled.

## Privacy and reactions

The migration provides RPCs for username-only discovery, friend requests, accepting/declining, removing friends, social sharing, and reactions. The feed bootstrap only returns accepted-friend events, and profile search exposes no email, XP, sanity, or task history. Reactions are limited to five named options and the database primary key enforces one reaction per user per event.

The demo session mirrors the same model locally so every route can be tested before applying the Supabase migration.
