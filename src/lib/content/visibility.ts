/**
 * Whether fixture content renders.
 *
 * The site needs fixture projects long before real ones exist: filtering,
 * ranking, and layout cannot be judged against an empty content directory.
 * A fixture that survives to the live site is the risk, so the exclusion runs
 * in the build rather than in memory.
 *
 * Development always shows placeholders. A production build hides them unless
 * INCLUDE_PLACEHOLDERS is set, which is how a preview of the full set is made.
 *
 * `env` is a parameter so the rule can be tested without touching the process.
 */

type Env = Record<string, string | undefined>;

/** Content carrying the flag. Anything with a `placeholder` boolean qualifies. */
export interface Placeholderable {
  placeholder: boolean;
}

export function includePlaceholders(env: Env = process.env): boolean {
  if (env.NODE_ENV !== "production") return true;
  return env.INCLUDE_PLACEHOLDERS === "1";
}

/** True when this item renders under the current environment. */
export function isVisible(item: Placeholderable, env: Env = process.env): boolean {
  return !item.placeholder || includePlaceholders(env);
}
