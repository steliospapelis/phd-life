# PhD Life

PhD Life is a small, private, playful RPG layer for doctoral life. It celebrates what happened today without turning the app into a planner, leaderboard, or guilt machine.

## Stack

Expo 57, React Native, TypeScript strict mode, Expo Router, NativeWind, Reanimated, Expo Haptics, SVG avatars, Zustand, and Supabase (Postgres, Auth, RLS, RPC).

## Local setup

1. Install Node.js LTS and run `npm install`.
2. Copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Start with `npm run dev`, then open the project in Expo Go or a development build.

Without Supabase variables the app runs in an isolated preview mode, which is useful for checking the UI. Preview mode is not a production data store.

## Supabase

Create a Supabase project, apply `supabase/migrations/0001_initial.sql`, then apply `supabase/seed.sql`. Only the publishable key belongs in the mobile app. Never put a service-role key in `.env` or the repository. Supabase Auth owns passwords; no application table stores them.

The client calls `complete_task` and `claim_daily_survival` RPCs. XP, sanity, daily idempotency, and task values are decided in the database. Review the policies in the migration before opening the app to a group.

## Google OAuth

In Supabase Auth → Providers, enable Google. In Google Cloud Console create an OAuth Web client and add Supabase’s callback URL shown in the provider settings. Add the app redirect URI `phdlife://auth/callback` to the Supabase and Google allowed redirect URL lists. Keep client secrets in the provider/dashboard configuration only. For production, use the same scheme in the development build configuration and test the callback on both iOS and Android.

Email confirmation and password reset are handled by Supabase Auth. Configure the project’s Site URL and redirect allow list for `phdlife://auth/callback` and `phdlife://auth/reset`.

## Commands

`npm run dev` · `npm run android` · `npm run ios` · `npm run web` · `npm run typecheck` · `npm run lint` · `npm test` · `npm run format`

For a store build, configure an EAS project with `eas build:configure`, then set production environment variables in EAS. Do not commit them.

## Current scope

Implemented: protected auth flow, onboarding, data-driven avatar, home/task logging, server-authoritative SQL operations, daily survival XP, mood/sanity architecture, non-linear weighted PhD journey, achievements catalogue, titles, social feed/reactions model, profile recap, RLS, tests, and content documentation.

Deferred intentionally: complete friend search/request UI, Realtime wiring, automatic achievement evaluator function, and the future sanity minigame. The database schema and service boundaries leave room for these without rewriting the core game loop.
