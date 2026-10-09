/**
 * The featured set on the home page.
 *
 * Projects are ranked, not flagged. `featured: 1` leads, and the home page
 * shows at most FEATURED_CAP of them, so later volume cannot bury the
 * strongest work.
 *
 * Two projects at one rank make the home page order arbitrary. That fault
 * would surface months later as a silent reorder, so it stops the build.
 * scripts/validate-content.mjs imports findDuplicateRanks from this file, so
 * the CI check and the build apply one rule.
 *
 * This module reads no files and imports nothing with a path alias. Node can
 * then import it directly, for the tests and for the validation script.
 */

export const FEATURED_CAP = 5;

/** The fields this module needs. A loaded project satisfies it. */
export interface Rankable {
  slug: string;
  frontmatter: { featured?: number };
}

export interface RankCollision {
  rank: number;
  slugs: string[];
}

/** Every rank that two or more projects claim, in ascending rank order. */
export function findDuplicateRanks(projects: readonly Rankable[]): RankCollision[] {
  const byRank = new Map<number, string[]>();

  for (const { slug, frontmatter } of projects) {
    const rank = frontmatter.featured;
    if (rank === undefined) continue;
    byRank.set(rank, [...(byRank.get(rank) ?? []), slug]);
  }

  return [...byRank]
    .filter(([, slugs]) => slugs.length > 1)
    .sort((a, b) => a[0] - b[0])
    .map(([rank, slugs]) => ({ rank, slugs }));
}

/** One line per collision, naming every slug at that rank. */
export function describeCollision({ rank, slugs }: RankCollision): string {
  const names = slugs.map((s) => `"${s}"`).join(" and ");
  return `Featured rank ${rank} has more than one project: ${names}. Give each project a different rank.`;
}

/** Stop when two projects claim one rank. The message names every slug. */
export function assertUniqueRanks(projects: readonly Rankable[]): void {
  const collisions = findDuplicateRanks(projects);
  if (collisions.length === 0) return;

  throw new Error(
    `Duplicate featured rank in content/projects.\n${collisions
      .map((c) => `  ${describeCollision(c)}`)
      .join("\n")}`,
  );
}

/**
 * The featured projects in rank order, ascending, at most FEATURED_CAP.
 * Throws when two projects claim one rank. An empty result is valid.
 */
export function selectFeatured<T extends Rankable>(projects: readonly T[]): T[] {
  assertUniqueRanks(projects);

  return projects
    .filter((p) => p.frontmatter.featured !== undefined)
    .sort((a, b) => a.frontmatter.featured! - b.frontmatter.featured!)
    .slice(0, FEATURED_CAP);
}
