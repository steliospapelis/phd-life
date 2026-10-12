import { describe, expect, it } from "vitest";
import { AUTH_MESSAGES, getAuthErrorMessage } from "@/src/features/auth/getFriendlyAuthError";
import { isObfuscatedSignupUser, normalizeEmail, validateLogin, validateSignup } from "@/src/features/auth/validation";
import { withAuthTimeout } from "@/src/features/auth/withAuthTimeout";

describe("auth validation", () => {
  it("reports every empty login field", () => expect(validateLogin("", "")).toEqual({ email: "Enter your email.", password: "Enter your password." }));
  it("treats whitespace email as empty and trims only email", () => {
    expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com");
    expect(validateLogin("   ", " ")).toEqual({ email: "Enter your email." });
  });
  it("rejects malformed emails", () => expect(validateLogin("stelios@", "validpass")).toEqual({ email: "Enter a valid email address." }));
  it("does not trim passwords", () => expect(validateSignup("user@example.com", " 1234567", " 1234567")).toEqual({}));
  it("reports all relevant signup errors", () => expect(validateSignup("", "", "")).toEqual({ email: "Enter your email.", password: "Create a password.", confirmPassword: "Confirm your password." }));
  it("reports password confirmation problems", () => expect(validateSignup("user@example.com", "12345678", "different")).toEqual({ confirmPassword: "Passwords don't match." }));
  it("recognizes Supabase's obfuscated existing-user signup response", () => {
    expect(isObfuscatedSignupUser({ identities: [] }, null)).toBe(true);
    expect(isObfuscatedSignupUser({ identities: [{ provider: "email" }] }, null)).toBe(false);
    expect(isObfuscatedSignupUser({ identities: [] }, { access_token: "session" })).toBe(false);
  });
});

describe("auth error mapping", () => {
  it("maps structured Supabase codes without exposing them", () => {
    expect(getAuthErrorMessage({ code: "invalid_credentials", status: 400 }, "login").message).toBe(AUTH_MESSAGES.invalidCredentials);
    expect(getAuthErrorMessage({ code: "email_not_confirmed" }, "login").action).toBe("resend-confirmation");
    expect(getAuthErrorMessage({ code: "user_banned" }, "login").message).toContain("unavailable");
    expect(getAuthErrorMessage({ code: "email_exists" }, "signup").action).toBe("sign-in");
  });
  it("maps rate limits, network, provider, and unknown errors safely", () => {
    expect(getAuthErrorMessage({ status: 429 }, "login").message).toContain("Too many attempts");
    expect(getAuthErrorMessage(new TypeError("Failed to fetch"), "signup").message).toContain("couldn't connect");
    expect(getAuthErrorMessage({ code: "bad_oauth_state" }, "google").message).toContain("couldn't be completed");
    expect(getAuthErrorMessage({ code: "new_code_from_supabase" }, "login").message).toBe(AUTH_MESSAGES.serverError);
  });
});

describe("auth request lifecycle", () => {
  it("fails a hanging request with a safe timeout code", async () => {
    await expect(withAuthTimeout(new Promise(() => undefined), 5)).rejects.toMatchObject({ code: "auth_timeout" });
  });
});
