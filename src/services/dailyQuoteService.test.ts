import { beforeEach, describe, expect, it, vi } from "vitest";
import { DAILY_QUOTE_CACHE_KEY } from "@/src/domain/dailyQuote";
import { getDailyQuote, type DailyQuoteOptions, type QuoteRpcClient } from "@/src/services/dailyQuoteService";

type MemoryStorage = { values: Map<string, string>; getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> };

function createStorage(): MemoryStorage {
  const values = new Map<string, string>();
  return { values, async getItem(key) { return values.get(key) ?? null; }, async setItem(key, value) { values.set(key, value); } };
}

function createClient(data: unknown, error: { message: string } | null = null) {
  return { rpc: vi.fn(async () => ({ data, error })) };
}

const optionsFor = (storage: MemoryStorage, client: ReturnType<typeof createClient>, now = new Date("2026-09-07T12:00:00.000Z")): DailyQuoteOptions => ({ now, storage, client: client as QuoteRpcClient });

describe("dailyQuoteService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns the server-selected quote and caches it", async () => {
    const storage = createStorage();
    const client = createClient({ date: "2026-09-07", quote: { id: "quote-1", text: "Everyone sees this." } });
    const result = await getDailyQuote(optionsFor(storage, client));
    expect(result?.quote.text).toBe("Everyone sees this.");
    expect(JSON.parse(storage.values.get(DAILY_QUOTE_CACHE_KEY) ?? "{}")).toEqual(result);
  });

  it("returns the same server result for concurrent callers", async () => {
    const storage = createStorage();
    const client = createClient({ date: "2026-09-07", quote: { id: "quote-1", text: "One shared result." } });
    const results = await Promise.all([getDailyQuote(optionsFor(storage, client)), getDailyQuote(optionsFor(storage, client))]);
    expect(results[0]).toEqual(results[1]);
    expect(client.rpc).toHaveBeenCalledTimes(2);
  });

  it("uses a valid cached quote when the network fails", async () => {
    const storage = createStorage();
    await storage.setItem(DAILY_QUOTE_CACHE_KEY, JSON.stringify({ date: "2026-09-07", quote: { id: "quote-1", text: "Cached for today." } }));
    const result = await getDailyQuote(optionsFor(storage, createClient(null, { message: "offline" })));
    expect(result?.quote.text).toBe("Cached for today.");
  });

  it("rejects stale cached quotes and does not invent a replacement", async () => {
    const storage = createStorage();
    await storage.setItem(DAILY_QUOTE_CACHE_KEY, JSON.stringify({ date: "2026-09-06", quote: { id: "quote-1", text: "Yesterday only." } }));
    const result = await getDailyQuote(optionsFor(storage, createClient(null, { message: "offline" })));
    expect(result).toBeNull();
  });

  it("does not accept a server quote from another calendar date", async () => {
    const storage = createStorage();
    const result = await getDailyQuote(optionsFor(storage, createClient({ date: "2026-09-08", quote: { id: "quote-2", text: "Tomorrow." } })));
    expect(result).toBeNull();
  });
});
