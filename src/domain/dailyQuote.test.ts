import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DAILY_QUOTE_UNAVAILABLE, getCurrentAppDate, isDailyQuoteForDate, type DailyQuote } from "@/src/domain/dailyQuote";

describe("shared daily quote policy", () => {
  it("uses Europe/Athens rather than the UTC date around midnight", () => {
    expect(getCurrentAppDate(new Date("2026-09-07T20:59:59.000Z"))).toBe("2026-09-07");
    expect(getCurrentAppDate(new Date("2026-09-07T21:00:00.000Z"))).toBe("2026-09-08");
  });

  it("accepts only a cache entry for the current app date", () => {
    const quote: DailyQuote = { date: "2026-09-07", quote: { id: "quote-1", text: "Shared wisdom." } };
    expect(isDailyQuoteForDate(quote, "2026-09-07")).toBe(true);
    expect(isDailyQuoteForDate(quote, "2026-09-08")).toBe(false);
    expect(DAILY_QUOTE_UNAVAILABLE).toContain("Wi-Fi");
  });

  it("seeds exactly 180 data-only quotes and protects the daily date", () => {
    const migration = readFileSync("supabase/migrations/0012_shared_daily_quotes.sql", "utf8");
    expect([...migration.matchAll(/^\('/gm)].length).toBe(180);
    expect(migration).toContain("date date primary key");
    expect(migration).toContain("on conflict (date) do nothing");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("not exists (select 1 from public.daily_quotes d where d.quote_id = q.id)");
  });
});
