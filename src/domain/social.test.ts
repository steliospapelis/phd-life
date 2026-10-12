import { describe, expect, it } from "vitest";
import { formatRelativeTime, formatSharedActivity, formatSocialEvent, socialReactionOptions } from "@/src/domain/social";
import type { SocialEvent } from "@/src/types/models";

const event = (type: SocialEvent["type"], metadata: SocialEvent["metadata"] = {}): SocialEvent => ({ id: "event", userId: "user", username: "maria_phd", avatar: { presentation: "neutral", skinTone: "#C98D6B", hairStyle: "short", hairColor: "#2D2630", outfit: "hoodie", accessory: null }, type, createdAt: "2026-09-15T10:00:00.000Z", metadata, reactions: {} });

describe("social event presentation", () => {
  it("formats meaningful events with centralized copy", () => {
    expect(formatSocialEvent(event("paper_submitted"))).toMatchObject({ primaryText: "maria_phd submitted a paper.", secondaryText: "It belongs to the reviewers now." });
    expect(formatSocialEvent(event("achievement_unlocked", { achievementName: "Reviewer #2 Survivor" })).secondaryText).toBe("Reviewer #2 Survivor");
  });

  it("uses friendly relative timestamps", () => {
    const now = new Date("2026-09-15T12:00:00.000Z");
    expect(formatRelativeTime("2026-09-15T11:45:00.000Z", now)).toBe("15m");
    expect(formatRelativeTime("2026-09-14T10:00:00.000Z", now)).toBe("Yesterday");
  });

  it("keeps shared activity copy limited to milestones, achievements, and citations", () => {
    expect(formatSharedActivity(event("milestone", { title: "First Paper", flavorText: "The reviewers have it now." }))).toEqual({ actionLabel: "completed a milestone", categoryLabel: "Milestone", categoryIcon: "🏁", title: "First Paper", flavorText: "The reviewers have it now." });
    expect(formatSharedActivity(event("achievement", { title: "Works On My Machine" })).actionLabel).toBe("unlocked an achievement");
    expect(socialReactionOptions).toEqual([{ value: "citation", label: "Cite" }]);
  });
});
