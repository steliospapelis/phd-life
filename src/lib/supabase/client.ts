import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/src/config/app";

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;
