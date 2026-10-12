export const APP_NAME = "PhD Life";
export const APP_TIME_ZONE = "Europe/Athens";
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && !SUPABASE_URL.includes("your-project"));
export const redirectUrl = `${process.env.EXPO_PUBLIC_REDIRECT_SCHEME ?? "phdlife"}://auth/callback`;
