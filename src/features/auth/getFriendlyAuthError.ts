import type { AuthField } from "@/src/features/auth/validation";

export type AuthErrorContext = "login" | "signup" | "resend-confirmation" | "forgot-password";
export type AuthErrorAction = "resend-confirmation" | "sign-in";

export type FriendlyAuthError = {
  message: string;
  field?: AuthField;
  action?: AuthErrorAction;
  neutral?: boolean;
};

export const AUTH_MESSAGES = {
  invalidCredentials: "Email or password is incorrect.",
  emailNotConfirmed: "Please verify your email before signing in.",
  accountAlreadyExists: "An account already exists with this email. Sign in instead.",
  weakPassword: "Your password doesn't meet the security requirements.",
  loginRateLimited: "Too many attempts. Please wait a moment and try again.",
  emailRateLimited: "We've sent too many emails recently. Please wait a little before trying again.",
  resendRateLimited: "Please wait before requesting another verification email.",
  networkError: "We couldn't connect. Check your internet connection and try again.",
  serverError: "Something went wrong on our side. Please try again.",
  requestTimeout: "This is taking longer than expected. Please check your connection and try again.",
  verificationSent: "Verification email sent. Check your inbox.",
  emailNotAuthorized: "We couldn't send an email to this address. Try another email or contact the lab administrator.",
  accountUnavailable: "This account is currently unavailable. Please contact the lab administrator.",
} as const;

type ErrorShape = { code?: unknown; status?: unknown; message?: unknown };

function readError(error: unknown): ErrorShape {
  return typeof error === "object" && error !== null ? error as ErrorShape : { message: error instanceof Error ? error.message : "" };
}

function text(error: ErrorShape) {
  return typeof error.message === "string" ? error.message.toLowerCase() : "";
}

export function getAuthErrorMessage(error: unknown, context: AuthErrorContext): FriendlyAuthError {
  const details = readError(error);
  const code = typeof details.code === "string" ? details.code.toLowerCase() : "";
  const status = typeof details.status === "number" ? details.status : undefined;
  const message = text(details);

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) return { message: AUTH_MESSAGES.emailNotConfirmed, action: "resend-confirmation" };
  if (code === "auth_timeout") return { message: AUTH_MESSAGES.requestTimeout };
  if (code === "invalid_credentials" || message.includes("invalid login credentials") || message.includes("invalid email or password")) return { message: AUTH_MESSAGES.invalidCredentials };
  if (code === "user_banned") return { message: AUTH_MESSAGES.accountUnavailable };
  if (code === "email_exists" || code === "user_already_exists" || message.includes("user already registered")) return { message: AUTH_MESSAGES.accountAlreadyExists, action: "sign-in", field: "email" };
  if (code === "weak_password" || (message.includes("password") && (message.includes("weak") || message.includes("breached")))) return { message: AUTH_MESSAGES.weakPassword, field: "password" };
  if (code === "email_address_invalid" || code === "validation_failed" || message.includes("invalid email")) return { message: "Enter a valid email address.", field: "email" };
  if (code === "email_address_not_authorized") return { message: AUTH_MESSAGES.emailNotAuthorized, field: "email" };
  if (code === "over_email_send_rate_limit") return { message: context === "resend-confirmation" ? AUTH_MESSAGES.resendRateLimited : AUTH_MESSAGES.emailRateLimited };
  if (code === "over_request_rate_limit" || status === 429) return { message: context === "login" ? AUTH_MESSAGES.loginRateLimited : AUTH_MESSAGES.emailRateLimited };
  if (code === "email_provider_disabled") return { message: context === "signup" ? "Account creation is currently unavailable. Please try again later." : "Email sign-in is currently unavailable." };
  if (code === "provider_disabled" || code === "oauth_provider_not_supported") return { message: "Account creation is currently unavailable. Please try again later." };
  if (code === "unexpected_failure" || (status !== undefined && status >= 500 && status <= 599)) return { message: AUTH_MESSAGES.serverError };
  if (message.includes("network request failed") || message.includes("failed to fetch") || message.includes("enotfound") || message.includes("offline")) return { message: AUTH_MESSAGES.networkError };
  return { message: AUTH_MESSAGES.serverError };
}

export function getFriendlyAuthError(error: unknown, context: AuthErrorContext = "login") {
  return getAuthErrorMessage(error, context);
}
