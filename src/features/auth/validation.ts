export const AUTH_CONFIG = { minimumPasswordLength: 8 } as const;

export type AuthField = "email" | "password" | "confirmPassword";
export type AuthFieldErrors = Partial<Record<AuthField, string>>;

export function normalizeEmail(email: string) {
  return email.trim();
}

export function isObfuscatedSignupUser(user: { identities?: unknown[] } | null | undefined, session: unknown) {
  return Boolean(user && !session && Array.isArray(user.identities) && user.identities.length === 0);
}

export function isSensibleEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateLogin(email: string, password: string): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) errors.email = "Enter your email.";
  else if (!isSensibleEmail(normalizedEmail)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

export function validateSignup(email: string, password: string, confirmPassword: string): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) errors.email = "Enter your email.";
  else if (!isSensibleEmail(normalizedEmail)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Create a password.";
  else if (password.length < AUTH_CONFIG.minimumPasswordLength) errors.password = `Use at least ${AUTH_CONFIG.minimumPasswordLength} characters.`;
  if (!confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (password !== confirmPassword) errors.confirmPassword = "Passwords don't match.";
  return errors;
}
