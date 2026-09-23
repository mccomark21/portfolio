import { z } from "zod";

// ---------------------------------------------------------------------------
// Post frontmatter – required by every blog post and all AI-generated content
// ---------------------------------------------------------------------------
export const PostFrontmatterSchema = z.object({
  title: z.string(),
  date: z.string(),
  summary: z.string(),
  repoUrl: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  needsReview: z.boolean().default(false),
});

export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;

// ---------------------------------------------------------------------------
// Project frontmatter — content/projects/<slug>.mdx
//
// The filename is the slug. There is no `slug` field: a second copy of the
// slug can disagree with the filename, and `repo` is the merge key into the
// generated repo record.
//
// Two layers render on the project page. `summary` is layer 1, for a reader
// who skims. The MDX body is layer 2, for a reader who wants depth.
// ---------------------------------------------------------------------------
export const ProjectStatusSchema = z.enum(["shipped", "exploration"]);

export const ProjectTagSchema = z.enum([
  "data-analysis",
  "application",
  "model",
]);

export const ProjectMetricSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const ProjectPeriodSchema = z.object({
  start: z.string(),
  // null means the work is still open. The field itself may also be absent.
  end: z.string().nullable().default(null),
});

export const ProjectLinksSchema = z.object({
  demo: z.string().url().optional(),
  // A slug in content/posts, not a URL. validate-content.mjs resolves it.
  writeup: z.string().optional(),
});

export const ProjectFrontmatterSchema = z.object({
  title: z.string(),
  summary: z.string(),
  status: ProjectStatusSchema,
  // 1-5 is a pinned rank. Absent means the project shows in the archive only.
  featured: z.number().int().min(1).max(5).optional(),
  placeholder: z.boolean().default(false),
  repo: z.string().optional(), // "owner/name"
  role: z.string().optional(),
  period: ProjectPeriodSchema.optional(),
  metrics: z.array(ProjectMetricSchema).default([]),
  links: ProjectLinksSchema.default({}),
  tags: z.array(ProjectTagSchema).default([]),
  // Phase 2 unions this with the languages the GitHub sync derives.
  // See docs/plan/refactor-plan.md section 3.4.
  techStack: z.array(z.string()).default([]),
});

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type ProjectTag = z.infer<typeof ProjectTagSchema>;
export type ProjectMetric = z.infer<typeof ProjectMetricSchema>;
export type ProjectFrontmatter = z.infer<typeof ProjectFrontmatterSchema>;

// ---------------------------------------------------------------------------
// Static page frontmatter – About, Education, Interests (optional title)
// ---------------------------------------------------------------------------
export const StaticPageFrontmatterSchema = z.object({
  title: z.string(),
});

export type StaticPageFrontmatter = z.infer<typeof StaticPageFrontmatterSchema>;

// ---------------------------------------------------------------------------
// Skills manifest – content/skills.json
// ---------------------------------------------------------------------------
export const SkillItemSchema = z.object({
  name: z.string(),
  projects: z.array(z.string()).default([]),
});

export const SkillCategorySchema = z.object({
  category: z.string(),
  skills: z.array(SkillItemSchema),
});

export const SkillsManifestSchema = z.object({
  generatedAt: z.string().optional(),
  categories: z.array(SkillCategorySchema),
});

export type SkillItem = z.infer<typeof SkillItemSchema>;
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type SkillsManifest = z.infer<typeof SkillsManifestSchema>;

// ---------------------------------------------------------------------------
// Enriched skills — returned by getEnrichedSkills(), not read directly from disk.
// `projects` is computed by cross-referencing techStack across posts and projects;
// it is NOT the raw value from skills.json.
// ---------------------------------------------------------------------------
export interface EnrichedSkillItem {
  name: string;
  projects: string[];
}

export interface EnrichedSkillCategory {
  category: string;
  skills: EnrichedSkillItem[];
}

export interface EnrichedSkillsManifest {
  generatedAt?: string;
  categories: EnrichedSkillCategory[];
}

// ---------------------------------------------------------------------------
// Watched repos – content/repos.json
// ---------------------------------------------------------------------------
export const WatchedRepoSchema = z.object({
  url: z.string().url(),
  lastIngested: z.string().optional(),
});

export const ReposManifestSchema = z.array(WatchedRepoSchema);

export type WatchedRepo = z.infer<typeof WatchedRepoSchema>;
