import { describe, expect, it } from "vitest";
import { validateUsername } from "@/src/domain/username";
describe("username validation", () => { it("accepts safe short handles", () => expect(validateUsername("lab_rat")).toBeNull()); it("rejects unsafe handles", () => expect(validateUsername("a space")).toBeTruthy()); });
