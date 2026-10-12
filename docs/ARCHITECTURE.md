# Architecture

## Structure

`app/` contains thin Expo Router screens. `src/components/` contains focused visual pieces. `src/domain/` contains pure game calculations. `src/services/` contains Supabase mutations. `src/lib/supabase/` owns the configured client. `src/store/` is only transient/demo UI and local game state, not the production source of truth.

## Auth and boundaries

Supabase Auth owns credentials, sessions, email confirmation, reset links, and Google OAuth. The mobile app only receives the publishable key. Application identity is `auth.uid()`. Production mutations should call RPCs; clients never write XP, sanity, ledgers, task rewards, or achievement unlocks directly.

## XP and sanity

`xp_ledger` is append-only. `player_state.total_xp` is a server-maintained cache. `complete_task` locks the player row, reads the task reward, appends task/XP/sanity records, clamps sanity, and returns authoritative totals. `claim_daily_survival` uses a per-user/day unique source key, so repeated launches and two-device races cannot duplicate the reward. Level thresholds remain content data in `level_thresholds`.

## Shared daily quotes

`quotes` is the single quote pool and `daily_quotes` stores one server-selected quote per Europe/Athens calendar date. Home calls `get_or_create_daily_quote()` through `src/services/dailyQuoteService.ts`; the client never chooses or mutates a quote. The RPC serializes cycle selection with a transaction advisory lock and relies on the date primary key for same-day concurrency. A valid same-date result is cached locally for offline reads; stale cache entries are ignored.

## Progress and achievements

PhD milestones have independent weights and are stored per user, so completion order is intentionally unconstrained. The client’s weighted percentage helper mirrors the database content model. Achievements use a small `criteria_type` plus JSONB criteria contract; adding a supported evaluator does not require changing catalogue rows or UI cards.

## Social privacy

Friendship rows are participant-readable. Social events are readable by their owner and accepted friends only. XP ledgers and player state remain private. Reactions are tied to authenticated users and visible events. There is no ranking or comparison query.

## RLS

Every exposed table has RLS enabled. Catalogues are readable when active. User-owned data is restricted by `auth.uid()`. Game writes are intentionally exposed through narrowly granted security-definer RPCs with an explicit `search_path` and authenticated-user checks.
