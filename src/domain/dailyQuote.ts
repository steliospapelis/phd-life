import { APP_TIME_ZONE } from "@/src/config/app";

export { APP_TIME_ZONE };

export type Quote = { id: string; text: string };
export type DailyQuote = { date: string; quote: Quote };
export type CachedDailyQuote = DailyQuote;

export const DAILY_QUOTE_CACHE_KEY = "phd-life:daily-quote";
export const DAILY_QUOTE_UNAVAILABLE = "Today's academic wisdom is temporarily unavailable. Even wisdom needs Wi-Fi.";

export function getCurrentAppDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isDailyQuoteForDate(value: DailyQuote | null, date: string): value is DailyQuote {
  return value?.date === date;
}
