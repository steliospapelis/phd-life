export const usernamePattern = /^[A-Za-z0-9_]{3,16}$/;
export function validateUsername(value: string) {
  const username = value.trim();
  if (!usernamePattern.test(username)) return "Use 3–16 letters, numbers, or underscores.";
  return null;
}
