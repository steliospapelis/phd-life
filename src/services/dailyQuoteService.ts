import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSupabaseConfigured } from "@/src/config/app";
import { getCurrentAppDate, DAILY_QUOTE_CACHE_KEY, isDailyQuoteForDate, type CachedDailyQuote, type DailyQuote } from "@/src/domain/dailyQuote";
import { supabase } from "@/src/lib/supabase/client";

type QuoteStorage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> };
export type QuoteRpcClient = { rpc(functionName: string): PromiseLike<{ data: unknown; error: { message?: string } | null }> };
export type DailyQuoteOptions = { now?: Date; storage?: QuoteStorage; client?: QuoteRpcClient | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDailyQuote(value: unknown): DailyQuote | null {
  if (!isRecord(value) || typeof value.date !== "string" || !isRecord(value.quote)) return null;
  if (typeof value.quote.id !== "string" || typeof value.quote.text !== "string") return null;
  return { date: value.date, quote: { id: value.quote.id, text: value.quote.text } };
}

async function readCachedQuote(storage: QuoteStorage): Promise<CachedDailyQuote | null> {
  try {
    const raw = await storage.getItem(DAILY_QUOTE_CACHE_KEY);
    if (!raw) return null;
    return parseDailyQuote(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function getDailyQuote(options: DailyQuoteOptions = {}): Promise<DailyQuote | null> {
  const now = options.now ?? new Date();
  const date = getCurrentAppDate(now);
  const storage = options.storage ?? AsyncStorage;
  const cached = await readCachedQuote(storage);
  const client: QuoteRpcClient | null = options.client === undefined ? supabase : options.client;

  if (client && (isSupabaseConfigured || options.client !== undefined)) {
    try {
      const response = await client.rpc("get_or_create_daily_quote");
      const remote = response.error ? null : parseDailyQuote(response.data);
      if (remote && remote.date === date) {
        try { await storage.setItem(DAILY_QUOTE_CACHE_KEY, JSON.stringify(remote)); } catch { /* Storage failure must not hide a valid server quote. */ }
        return remote;
      }
    } catch {
      // The cache is the offline path. A missing/stale cache is handled below.
    }
  }

  return isDailyQuoteForDate(cached, date) ? cached : null;
}
