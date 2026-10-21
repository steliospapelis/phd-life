import { describe, expect, it } from "vitest";
import { isTitleUnlocked, sortTitles } from "@/src/domain/titleUtils";
import type { Title } from "@/src/types/models";

const levelTitle = (overrides: Partial<Title> = {}): Title => ({
  id: "level-title",
  name: "Compiler Whisperer",
  source: "level",
  unlockLevel: 5,
  requiredLevel: 5,
  unlocked: false,
  ...overrides,
});

describe("title utilities", () => {
  it("recognizes a reached level title even when the remote snapshot is stale", () => {
    expect(isTitleUnlocked(levelTitle(), 5)).toBe(true);
    expect(isTitleUnlocked(levelTitle(), 4)).toBe(false);
  });

  it("keeps explicitly unlocked reward titles available", () => {
    const title = levelTitle({ source: "achievement", requiredLevel: null, unlockLevel: null, unlocked: true });
    expect(isTitleUnlocked(title, 1)).toBe(true);
  });

  it("sorts unlocked titles before locked titles", () => {
    const titles = [levelTitle({ id: "locked", name: "Locked", requiredLevel: 7, unlockLevel: 7 }), levelTitle({ id: "unlocked", name: "Unlocked" })];
    expect(sortTitles(titles, "", 5).map((title) => title.id)).toEqual(["unlocked", "locked"]);
  });
});
