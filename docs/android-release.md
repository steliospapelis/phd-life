# Android release readiness

## Build

The internal testing profile produces a directly installable APK:

```text
eas build --platform android --profile preview
```

The profile is defined in `eas.json` with internal distribution and `buildType: apk`.

## Native identity

- Android package: `com.example.phdlife`
- Deep-link scheme: `phdlife`
- OAuth callback: `phdlife://auth/callback`
- Supabase URL and publishable key: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The app reads Supabase configuration from Expo public environment variables. It does not use localhost, browser storage, or a service-role key.

## OAuth configuration

The current codebase implements Google OAuth, not GitHub OAuth. For Google sign-in in a standalone APK, add this exact redirect URL to the Supabase Auth redirect allow-list:

```text
phdlife://auth/callback
```

If GitHub sign-in is required later, configure the GitHub provider in Supabase and add the same callback URL to the GitHub OAuth app, then implement the provider-specific sign-in flow. A real-device OAuth test is still required because the browser-to-native callback cannot be fully verified by static checks.

## Physical-device checklist

1. Install the preview APK and launch it without Expo Go or Metro.
2. Create an account and confirm the automatic `PhD Started (Voluntarily)` milestone.
3. Log out, log in again, kill the app, reopen it, and verify the session persists.
4. Check Home, Tasks, Journey, Social, Profile, and bottom-tab content at the smallest device size.
5. Log a task and verify XP, level progress, and the report update.
6. Adjust Sanity, restart, and verify it persists.
7. Open Journey, complete a milestone, share it, and react to it in Social.
8. Edit the avatar, restart, and verify the avatar remains saved.
9. Select a title and verify it appears across the app.
10. Search for a labmate, send or accept a request, open the profile, and test removal.
11. Test Android Back on sheets, secondary routes, and the root tab.
12. Test the shortest and longest text cases and confirm nothing is clipped behind the bottom navigation.
13. Test Google OAuth with the `phdlife://auth/callback` redirect.
14. Confirm logout works.
