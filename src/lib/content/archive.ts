/**
 * Search and filter rules for the /projects archive.
 *
 * Pure functions only: the archive is a static export, so these run in the
 * browser over the project list the page was built with. Keeping them free of
 * React and the file system lets `node --test` cover them directly.
 *
 * Filters combine with AND: a project shows only when it passes the search and
 * every filter that is set. Each filter holds one value or none.
 */
import type { ProjectFrontmatter, ProjectStatus, ProjectTag } from "./schemas";

/** The fields the archive reads. A ProjectMeta satisfies this. */
export interface ArchiveProject {
  slug: string;
  frontmatter: Pick<ProjectFrontmatter, "title" | "summary" | "status" | "tags" | "techStack">;
}

export interface ArchiveFilters {
  /** Free text. Matches title and summary. */
  q: string;
  tag: ProjectTag | null;
  status: ProjectStatus | null;
  /**
   * Reads `techStack` until the Phase 2 GitHub sync supplies repo languages.
   * See docs/plan/refactor-plan.md section 3.4.
   */
  language: string | null;
}

/** The values each filter offers, in display order. */
export interface ArchiveOptions {
  tags: ProjectTag[];
  statuses: ProjectStatus[];
  languages: string[];
}

export const EMPTY_FILTERS: ArchiveFilters = { q: "", tag: null, status: null, language: null };

/** Query-string keys. Short, so a shared URL stays readable. */
export const FILTER_PARAMS = {
  q: "q",
  tag: "tag",
  status: "status",
  language: "lang",
} as const;

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * True when every word of the query occurs in the title or the summary.
 * Case does not matter. An empty query matches everything.
 */
export function matchesSearch(project: ArchiveProject, query: string): boolean {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalize(`${project.frontmatter.title} ${project.frontmatter.summary}`);
  return terms.every((term) => haystack.includes(term));
}

/** True when the project passes the search and every filter that is set. */
export function matchesFilters(project: ArchiveProject, filters: ArchiveFilters): boolean {
  const { frontmatter } = project;
  if (filters.tag && !frontmatter.tags.includes(filters.tag)) return false;
  if (filters.status && frontmatter.status !== filters.status) return false;
  if (filters.language) {
    const wanted = filters.language.toLowerCase();
    if (!frontmatter.techStack.some((t) => t.toLowerCase() === wanted)) return false;
  }
  return matchesSearch(project, filters.q);
}

export function filterProjects<T extends ArchiveProject>(projects: T[], filters: ArchiveFilters): T[] {
  return projects.filter((p) => matchesFilters(p, filters));
}

export function isFiltered(filters: ArchiveFilters): boolean {
  return Boolean(normalize(filters.q) || filters.tag || filters.status || filters.language);
}

/**
 * The options each filter offers. Only values that at least one project
 * carries are offered, so no option leads to an empty list by itself.
 * Tags and statuses keep the order of `tagOrder` and `statusOrder` (the
 * schema order). Languages sort alphabetically, without regard to case.
 */
export function archiveOptions(
  projects: ArchiveProject[],
  tagOrder: readonly ProjectTag[],
  statusOrder: readonly ProjectStatus[],
): ArchiveOptions {
  const tags = new Set<ProjectTag>();
  const statuses = new Set<ProjectStatus>();
  const languages = new Map<string, string>(); // lower case -> first spelling seen

  for (const { frontmatter } of projects) {
    frontmatter.tags.forEach((t) => tags.add(t));
    statuses.add(frontmatter.status);
    for (const t of frontmatter.techStack) {
      const key = t.toLowerCase();
      if (!languages.has(key)) languages.set(key, t);
    }
  }

  return {
    tags: tagOrder.filter((t) => tags.has(t)),
    statuses: statusOrder.filter((s) => statuses.has(s)),
    languages: [...languages.values()].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" }),
    ),
  };
}

/** Anything with `get`. URLSearchParams and Next's ReadonlyURLSearchParams both qualify. */
interface ParamReader {
  get(name: string): string | null;
}

/**
 * Reads filter state from a query string. A value that is not an offered
 * option is ignored, so a stale or hand-edited URL shows the full list rather
 * than an empty one.
 */
export function parseFilters(params: ParamReader, options: ArchiveOptions): ArchiveFilters {
  const tag = params.get(FILTER_PARAMS.tag);
  const status = params.get(FILTER_PARAMS.status);
  const language = params.get(FILTER_PARAMS.language)?.toLowerCase();

  return {
    q: params.get(FILTER_PARAMS.q) ?? "",
    tag: options.tags.find((t) => t === tag) ?? null,
    status: options.statuses.find((s) => s === status) ?? null,
    language: options.languages.find((l) => l.toLowerCase() === language) ?? null,
  };
}

/** The query string for a filter state, without the leading "?". Empty filters are left out. */
export function toQueryString(filters: ArchiveFilters): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set(FILTER_PARAMS.q, filters.q.trim());
  if (filters.tag) params.set(FILTER_PARAMS.tag, filters.tag);
  if (filters.status) params.set(FILTER_PARAMS.status, filters.status);
  if (filters.language) params.set(FILTER_PARAMS.language, filters.language);
  return params.toString();
}
