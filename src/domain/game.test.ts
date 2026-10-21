import { describe, expect, it } from "vitest";
import { clampSanity, getLevelForXp, getPhdProgress, getSanityMood, getSanityState, getXpProgress } from "@/src/domain/game";

describe("game domain", () => {
  it("calculates levels and progress from thresholds", () => { expect(getLevelForXp(0)).toBe(1); expect(getLevelForXp(450)).toBe(4); expect(getXpProgress(630)).toMatchObject({ level: 4, intoLevel: 180, required: 250 }); });
  it("maps sanity to deterministic moods", () => { expect(getSanityMood(90)).toBe("energized"); expect(getSanityMood(60)).toBe("okay"); expect(getSanityMood(20)).toBe("frazzled"); expect(getSanityMood(0)).toBe("destroyed"); });
  it("maps every sanity boundary to its canonical state", () => {
    expect(getSanityState(0).label).toBe("Academic Damage");
    expect(getSanityState(14).label).toBe("Academic Damage");
    expect(getSanityState(15).label).toBe("Running on Fumes");
    expect(getSanityState(29).label).toBe("Running on Fumes");
    expect(getSanityState(30).label).toBe("Questionable");
    expect(getSanityState(44).label).toBe("Questionable");
    expect(getSanityState(45).label).toBe("Holding It Together");
    expect(getSanityState(59).label).toBe("Holding It Together");
    expect(getSanityState(60).label).toBe("Surprisingly Functional");
    expect(getSanityState(74).label).toBe("Surprisingly Functional");
    expect(getSanityState(75).label).toBe("Thriving, Somehow");
    expect(getSanityState(89).label).toBe("Thriving, Somehow");
    expect(getSanityState(90).label).toBe("Suspiciously Well");
    expect(getSanityState(100).label).toBe("Suspiciously Well");
  });
  it("clamps and rounds sanity safely", () => { expect(clampSanity(-3)).toBe(0); expect(clampSanity(105)).toBe(100); expect(clampSanity(42.6)).toBe(43); expect(clampSanity(Number.NaN)).toBe(0); });
  it("uses milestone weights", () => { expect(getPhdProgress([{ weight: 2, completed: true } as never, { weight: 8, completed: false } as never])).toBe(20); });
  it("calculates canonical PhD progress from milestone weights only", () => {
    const milestones = [5, 5, 5, 5, 5, 5, 10, 10, 10, 20, 20].map((weight, index) => ({ weight, completed: index === 0 || index === 9 }));
    expect(getPhdProgress(milestones as never)).toBe(25);
    expect(getPhdProgress(milestones.map((item) => ({ ...item, completed: true })) as never)).toBe(100);
  });
  it("ignores non-core milestones", () => {
    expect(getPhdProgress([{ weight: 100, completed: true, isCoreJourney: false }] as never)).toBe(0);
  });
});
