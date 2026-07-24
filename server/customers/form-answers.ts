const MAX_KEYS = 20;
const MAX_KEY_LENGTH = 64;
const MAX_VALUE_LENGTH = 200;

/**
 * Validates the `formAnswers` object posted by the multi-step form runtime.
 * This is a public unauthenticated endpoint, so anything unexpected is
 * rejected outright (null) rather than coerced.
 */
export function sanitizeFormAnswers(
  input: unknown,
): Record<string, string> | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return null;
  }
  const entries = Object.entries(input as Record<string, unknown>);
  if (entries.length > MAX_KEYS) return null;
  const out: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (key.length === 0 || key.length > MAX_KEY_LENGTH) return null;
    if (typeof value !== "string" || value.length > MAX_VALUE_LENGTH) {
      return null;
    }
    out[key] = value;
  }
  return out;
}
